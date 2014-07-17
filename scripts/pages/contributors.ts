
  # add a new JSON array (this structure makes the most sense for this example)
  jsonlib.array() {
    $("/html/body") {
      # this Tritium will select multiple elements
      # ( due to the structure of our HTML )
      $("//table[@class='medium-mastertable']") {
        # add a new value to the JSON array
        jsonlib.append() {
          # the value will be an object
          jsonlib.hash() {
            #Reset so if one is not found the attribute does not carry over from 
            #contributor to contributor
            $name       = ''
            $address    = ''
            $occupation = ''
            $city       = ''
            $date       = ''
            $amount     = ''

            $(".//td[3]") {
              $('.//i'){
                text(){
                  $remove("\n")
                  trim()
                  $name = this()
                }
                
                remove()
              }

              $('.//font'){
                
                text(){
                  $remove("\n")
                  trim()
                  $occupation = this()
                }
                
                remove()
              }

              text() {
                $remove("\n")
                trim()
                $address = this()
                
              }
            }

            $(".//td[4]") {
              text() {
                
                $remove("\n")

                trim()
                replace(/\s{2,}/,",")
                log("Found text: " + this())
                $city = this()
              }
            }
            $(".//td[5]") {
              text() {
                $remove("\n")
                trim()
                $date = this()
              }
            }


            $(".//td[6]") {
              text() {
                $remove("\n")
                trim()
                $amount = this()
              }
            }

            # and will contain these name/value pairs
            jsonlib.key("name", $name)
            jsonlib.key("address", $address)
            jsonlib.key("occupation", $occupation)
            jsonlib.key("city_state_zip", $city)
            jsonlib.key("date", $date)
            jsonlib.key("amount", $amount)

          }
        }
     
    }
  }
}

