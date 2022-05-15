#!/usr/bin/env node

/* cli.js
    
    CLI wrapper for oslicense package.
*/

"use strict";

// Dependencies.
import osl from "#app/oslicense";
import minimist from "minimist";
import minimistOpts from "minimist-options";
import { fileURLToPath } from "url";
import { statSync, existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

// ES6 module __dirname.
const __dirname = path.dirname(fileURLToPath(import.meta.url)),
    
    // Arguments configuration.
    ARG_OPTS = {
        // Shows CLI help text.
        help: {
            type: "boolean",
            alias: "h"
        },
        
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
        },
        
        // Shows the package version.
        version: {
            type: "boolean",
            alias: "v"
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
    let defaultFile = "LICENSE.md";
    
    text = typeof text === "string" ? text : "";
    
    if (!filePath) {
        filePath = defaultFile;
    }
    
    filePath = path.resolve(filePath);
    
    return new Promise(async (res, rej) => {
        try {
            // Check if path already exists and whether or not it is a directory
            let stat = statSync(filePath);
            
            if (stat.isDirectory()) {
                filePath += `${SEP}${defaultFile}`;
            }
            
            if (existsSync(filePath)) {
                rej(`License file already exists at '${filePath}'`);
            }
        }
        catch (e) {}
        
        try {
            await writeFile(filePath, text);
        }
        catch (e) {
            rej(`License file could not be written at '${filePath}'`);
        }
        
        res(filePath);
    });
}

/* Shows help text and exits.
*/
function showHelp() {
    let text = readFileSync(`${__dirname}/help.txt`, {
        encoding: "utf8"
    });
    
    console.log(text.trim());
    process.exit();
}

;(async () => {
    if (ARGS.help) {
        showHelp();
    }
    
    if (ARGS.version) {
        let pkg = readFileSync(`${__dirname}/package.json`, {
            encoding: "utf8"
        });
        
        pkg = JSON.parse(pkg);
        
        console.log(pkg.version);
        process.exit();
    }
    
    let license = ARGS._[0],
        text, licenseFile;
    
    if (ARGS.list) {
        // Get list of available licenses
        let list, order;
        
        try {
            list = await osl.getLicenses();
        }
        catch (e) {
            console.error(e);
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
        license = osl.getNearestLicense();
        
        if (!license) {
            console.error("No package.json file found with a valid 'license' " +
                "property");
            return;
        }
    }
    
    // Get the license
    try {
        text = await osl.getLicenseText(license);
        text += "\n";
    }
    catch (e) {
        console.error(e);
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
