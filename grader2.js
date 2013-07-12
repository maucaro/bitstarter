#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var HTMLTEMPFILE = "~" + HTMLFILE_DEFAULT;
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var processHtmlFile = function(htmlfile, checkfile) {
    var checkJson = checkHtmlFile(htmlfile, checkfile);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);    
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var processUrl = function(result, response) {
    if (result instanceof Error) {
        console.error('Error: invalid URL');
    } else {
        fs.writeFileSync(HTMLTEMPFILE, result);
        processHtmlFile(HTMLTEMPFILE, program.checks)
    }
};


if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file [html_file]', 'Path to HTML file', clone(assertFileExists))
        .option('-u, --url [html_url]', 'URL to HTML file')
        .parse(process.argv);
    if(program.url) {
        rest.get(program.url).on('complete', processUrl);
    }
    else if(program.file) {
        processHtmlFile(program.file, program.checks)
    }
    else console.log('Error: no file or URL specified')
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

