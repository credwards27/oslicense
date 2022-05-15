/* oslicense.js
    
    OSI license API interface.
    
    See https://github.com/OpenSourceOrg/api/blob/master/doc/endpoints.md for
    endpoint documentation.
*/

"use strict";

// Dependencies.
import https from "https";
import { existsSync, readFileSync } from "fs";
import path from "path";

// API URLs and endpoint fragments.
const API = {
    root: "https://api.opensource.org/",
    rootText: "https://raw.githubusercontent.com/OpenSourceOrg/licenses/" +
        "master/texts/plain/",
    license: "license/",
    licenses: "licenses/"
};

/* Gets a list of all OSI licenses.
    
    Returns a promise that resolves to an object containing all OSI license
    names, keyed by license IDs.
*/
async function getLicenses() {
    let promise = new Promise((res, rej) => {
        https.get(API.root + API.licenses, (req) => {
            let data = "";
            
            req.on("data", (chunk) => {
                data += chunk;
            });
            
            req.on("end", () => {
                try {
                    data = JSON.parse(data);
                }
                catch (e) {
                    rej("Invalid response received from the OSI API");
                }
                
                data.errors ? rej(data) : res(data)
            });
        });
    });
    
    return promise.then((val) => {
        let licenses = {};
        
        for (let i=0, l=val.length; i<l; ++i) {
            let curr = val[i];
            
            licenses[curr.id] = curr.name;
        }
        
        return licenses;
    });
}

/* Gets a license by license ID.
    
    id - License ID string (case sensitive).
    
    Returns a promise that resolves to an OSI license information object
    containing response data from the API.
*/
async function getLicenseData(id) {
    return new Promise((res, rej) => {
        https.get(`${API.root}${API.license}${id}`, (req) => {
            let data = "";
            
            req.on("data", (chunk) => {
                data += chunk;
            });
            
            req.on("end", () => {
                try {
                    data = JSON.parse(data);
                }
                catch (e) {
                    rej("Invalid response received from the OSI API");
                }
                
                if (data.errors) {
                    // Consolidate error messages from API
                    let messages = data.errors.map((err) => {
                        return err ? (err.message || "") : "";
                    }).filter((msg) => { return !!msg; });
                    
                    rej(
                        messages.filter((msg) => {
                            return !!msg;
                        }).join("\n")
                    );
                }
                
                res(data);
            });
        });
    });
}

/* Gets license text from an OSI license information object.
    
    license - OSI license information object or license ID string (see
        getLicenseData()).
    
    Returns a promise that resolves to license text from the provided OSI
    license information object.
*/
async function getLicenseText(license) {
    if (typeof license === "string") {
        license = await getLicenseData(license);
    }
    
    return new Promise((res, rej) => {
        if (!license || typeof license.id !== "string") {
            rej("Invalid license object or ID provided");
        }
        
        https.get(`${API.rootText}${license.id}`, (req) => {
            let text = "";
            
            req.on("data", (chunk) => {
                text += chunk;
            });
            
            req.on("end", () => {
                if (200 !== req.statusCode) {
                    rej(`License text not found for '${license.id}'`);
                }
                
                res(text.trim());
            });
        });
    });
}

/* Gets the license ID from the nearest package.json file. This will check for a
    license property in package.json files in the following order:
        
        - In the current working directory
        - In the current working directory path's ancestor chain, starting with
          the parent directory
    
    If a package.json file is found, but it does not contain a 'license'
    property, the next directory will be checked until all directories have been
    checked.
    
    Returns the license ID string from the nearest package.json file relative
    to the current working directory. If no 'license' property is found in a
    package.json file, this will return undefined.
*/
function getNearestLicense() {
    // Attempt to get license type from local package.json
    let sep = path.sep,
        dirs = process.cwd().split(sep);
    
    while (dirs.length) {
        let config = dirs.join(sep) + `${sep}package.json`;
        
        if (existsSync(config)) {
            try {
                // Parse the file safely
                let file = readFileSync(config, "utf8"),
                    data = JSON.parse(file);
                
                if (typeof data.license === "string") {
                    return data.license;
                }
            }
            catch (e) {}
        }
        
        dirs.pop();
    }
}

export default {
    getLicenses: getLicenses,
    getLicenseData: getLicenseData,
    getLicenseText: getLicenseText,
    getNearestLicense: getNearestLicense
};
