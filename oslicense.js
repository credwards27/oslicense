/* oslicense.js
    
    OSI license API interface.
    
    See https://github.com/OpenSourceOrg/api/blob/master/doc/endpoints.md for
    endpoint documentation.
*/

"use strict";

// Dependencies.
const cheerio = require("cheerio"),
    https = require("https"),
    
    // API URLs and endpoint fragments.
    API = {
        root: "https://api.opensource.org/",
        license: "license/",
        licenses: "licenses/"
    },
    
    // DOM selector to extract license text.
    DOM_NODE_SELECTOR = "#LicenseText";

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
        https.get(API.root + API.license + id, (req) => {
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
                
                data.errors ? rej(data) : res(data);
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
        let versions = (license.text && license.text instanceof Array) ?
            license.text : null,
            version;
        
        if (null === versions) {
            rej("No license text found");
        }
        
        version = versions[0];
        
        https.get(version.url, (req) => {
            let html = "";
            
            req.on("data", (chunk) => {
                html += chunk;
            });
            
            req.on("end", () => {
                let $ = cheerio.load(html),
                    node = $(DOM_NODE_SELECTOR);
                
                if (!node.length) {
                    rej("License text was not found, license object is " +
                        "malformed and/or scraper may be out of date");
                }
                
                res(node.text().trim());
            });
        });
    });
}

module.exports = {
    getLicenses: getLicenses,
    getLicenseData: getLicenseData,
    getLicenseText: getLicenseText
};
