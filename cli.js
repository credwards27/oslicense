#!/usr/bin/env node

/* cli.js
    
    CLI wrapper for oslicense package.
*/

"use strict";

// Dependencies.
const osl = require("./oslicense"),
    minimist = require("minimist"),
    minimistOpts = require("minimist-options"),
    
    promisify = require("util").promisify,
    fs = require("fs"),
    path = require("path"),
    
    writeFileAsync = promisify(fs.writeFile),
    
    // Arguments configuration.
    ARG_OPTS = {
        // OSI license identifier (case-sensitive). If not specified, the
        // license specified in the nearest package.json file will be used. If
        // the nearest package.json file does not contain a license property, or
        // if no package.json file is found, then the license defaults to MIT.
        license: {
            type: "string",
            alias: "l"
        },
        
        // Optional alternate file name/path for the generated license file.
        output: {
            type: "string",
            alias: "o"
        },
        
        // Print license text to stdout instead of generating a license file.
        stdout: {
            type: "boolean",
            alias: "s"
        }
    },
    
    // Parsed CLI arguments.
    ARGS = Object.freeze(
        minimist(process.argv.slice(2), minimistOpts(ARG_OPTS))),
    
    // Path separator.
    SEP = path.sep;

/* Generates a license file if possible.
    
    text - License text for the file.
    
    filePath - File path to generated license file. Defaults to 'LICENSE.md' in
        process.cwd().
    
    Returns a promise that resolves to the generated license file path if
    successful, or an error message string if the file could not be created for
    some reason.
*/
async function generateLicense(text, filePath) {
    text = typeof text === "string" ? text : "";
    
    if (!filePath) {
        filePath = "LICENSE.md";
    }
    
    filePath = path.resolve(filePath);
    
    return new Promise(async (res, rej) => {
        if (fs.existsSync(filePath)) {
            rej(`License file already exists at '${filePath}'`);
        }
        
        try {
            await writeFileAsync(filePath, text);
        }
        catch (e) {
            rej(`License file could not be written at '${filePath}'`);
        }
        
        res(filePath);
    });
}

;(async () => {
    let license = ARGS.license || ARGS._[0],
        text, licenseFile;
    
    if (!license) {
        // Attempt to get license type from local package.json
        let dirs = process.cwd().split(SEP);
        
        while (dirs.length) {
            let config = dirs.join(SEP) + SEP + "package.json";
            
            if (fs.existsSync(config)) {
                license = require(config);
                license = license.license || "MIT";
                
                break;
            }
            
            dirs.pop();
        }
    }
    
    // Get the license
    try {
        text = await osl.getLicenseText(license);
        text += "\n";
    }
    catch (e) {
        let errors = e.errors;
        
        if (errors instanceof Array) {
            for (let i=0, l=errors.length; i<l; ++i) {
                let err = errors[i];
                console.error(err.message ? err.message : err);
            }
        }
        else {
            console.error(errors);
        }
        
        return;
    }
    
    // Output directly, or generate a license file
    if (ARGS.stdout) {
        process.stdout.write(text);
        
        return;
    }
    
    try {
        licenseFile = await generateLicense(text, ARGS.output);
    }
    catch (e) {
        console.error(e);
        
        return;
    }
    
    console.log(`License file created at '${licenseFile}'`);
    console.log("Don't forget to fill in the blanks!");
})();
