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
        // Lists available licenses with associated IDs.
        list: {
            type: "boolean",
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
    let license = ARGS._[0],
        text, licenseFile;
    
    if (ARGS.list) {
        // Get list of available licenses
        let list, order;
        
        try {
            list = await osl.getLicenses();
        }
        catch (e) {
            console.log(e);
            return;
        }
        
        order = Object.keys(list).sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        
        console.log("Available licenses:\n");
        
        for (let i=0, l=order.length; i<l; ++i) {
            let id = order[i];
            
            console.log(`${id}:`);
            console.log(`    ${list[id]}`);
        }
        
        return;
    }
    
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
        console.log(e);
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
