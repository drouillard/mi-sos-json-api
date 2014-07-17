# Collecting MI SOS Campaign Information
This project allows for the scraping of Michigan's Secretary of State site in order to collect information on political campaigns. This project uses the [Moovweb](http://www.moovweb.com) Platform to create a synethic JSON API, which then can be consumed from the scripts located in command_line_tools.

## Before Running This
To run this project, you must have the Moovweb SDK installed on your system. For installation and account information go to [the download page on the Moovweb site](http://developer.moovweb.com/download). 

## Starting
Currently contributions is the only area implemented. In order to get the required parameters view the campaign in question on the [Michigan SoS website](http://www.michigan.gov/sos/0,1607,7-127-1633_8723_8751---,00.html). The query parameters present should be copied into the command line scripts.

First start up the Moovweb server 

    $ sudo moov start

Then in a separate tab you can make calls to this server using the Ruby command line scripts. E.G.

    $ ruby gather_contributors.rb 

## Saving Results
By default results are saved to a TSV file named results.tsv

## Deployment
You can deploy this project to the Moovweb cloud infrastructure and then call the API server from there

## Domains
If running `sudo moov server`, remember to put all domains you're going to hit in your etc/hosts if you run your server with the `-auto-hosts=false` option.

    127.0.0.1   mlocal.miboecfr.nictusa.com
