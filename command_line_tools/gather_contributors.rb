require 'net/http'
require 'uri'
require 'json'

BASE_SERVER_URL = 'http://mlocal.miboecfr.nictusa.com/cgi-bin/cfr/'
BASE_PATH = 'contrib_anls_res.cgi'
FIXED_PARAMS = {  }

# Donation TSV Settings
DONATION_TSV_FILENAME = 'results.tsv'
ATTRIBUTES_TO_EXTRACT = %w( name date address amount city state zip city_state_zip occupation )


class ArrayToTsvWriter
  def initialize(opts)
    @filename = opts[:output_filename]
    @attributes  = opts[:attributes]
    @arr      = opts[:array]
  end

  def write
    write_header_row
    write_content
  end

  private

  def output_stream
    @output_stream ||= File.open(@filename, "w")
  end

  def write_header_row
    output_stream.write @attributes.join("\t").concat("\n")
  end

  def explode_city_state_zip_attribute element
    city_state_zip_str = element["city_state_zip"] || ""
    city = state = zip = ''

    if result = city_state_zip_str.match(/(.+?),(\S+).+?([0-9-]+)/)
      city, state, zip = result.captures
    end

    element.merge("city" => city, "state" => state, "zip" => zip)
  end

  def write_content
    @arr.each do |element|
      element = explode_city_state_zip_attribute(element)

      row_str = @attributes.collect{ |attribute| element[attribute] }.join("\t")
      output_stream.write row_str.concat("\n")
    end
  end

end

class IncrementingParameter
  def initialize(opts)
    @name = opts[:name]
    @current_amount = @initial_amount = opts[:initial_amount]
    @increment_amount = opts[:increment_amount]
    raise "Missing option for incrementingParamater" if (!@name || !@current_amount)
  end

  def current_amount
    @current_amount
  end

  def to_hash
    { @name => @current_amount }
  end

  def increment
    @current_amount += @increment_amount
  end
end

class FundingGatherer 

  def initialize(opts)
    @uri = URI.parse(opts[:uri])
    @fixed_params = opts[:fixed_params]
    @variable_param = IncrementingParameter.new(opts[:variable_param])
    @records_gathered = []

    check_params
  end

  def check_params
    raise "No set of fixed params provided" unless @fixed_params
    raise "No incrementing param provided" unless @variable_param
    raise "No site was provided to get results from" unless @uri
  end

  def gather
    all_results_retrieved = false

    while !all_results_retrieved do

      #Merge the fixed results with the increment result to simulate pagination
      params = @fixed_params.merge(@variable_param.to_hash)
      @uri.query = URI.encode_www_form(params)

      #Fetch the actual results
      result = Net::HTTP.get(@uri)
     
      result_arr = JSON.parse(result)
      result_arr.reject! { |x| x["name"].nil? ||  x["name"].empty?}  

      #Examine the resulting JSON and determine next steps based on if it appears more records can be gathered
      if result_arr.length > 0
        @records_gathered.concat result_arr
      else
        all_results_retrieved = true
      end
      
      all_results_retrieved = true

    end

  end

  def results
    @records_gathered
  end


  def print_stats
    puts "Gathered #{@records_gathered.size}.\n"
  end

  def write_results_to_tsv(filename, attributes)
    ArrayToTsvWriter.new({ output_filename: filename, array: @records_gathered, attributes: attributes}).write
  end
end

 fg = FundingGatherer.new({uri: BASE_SERVER_URL + BASE_PATH, fixed_params: FIXED_PARAMS, variable_param: { name: 'last_match', initial_amount: 0, increment_amount: 100 } })
 fg.gather
 fg.print_stats
 fg.write_results_to_tsv(DONATION_TSV_FILENAME, ATTRIBUTES_TO_EXTRACT)

