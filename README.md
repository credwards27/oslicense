# Open Source Licenses

Quickly and easily license your projects with licenses from the Open Source Initiative.

*This project is not directly affiliated with Open Source Initiative; it consumes data from the public API and license repository. See the following for more information:*

- https://opensource.org
- https://api.opensource.org
- https://github.com/OpenSourceOrg/licenses

## Installation

### Global CLI

```
# Global CLI
npm install --global oslicense

# Module
npm install oslicense
```

## Usage (CLI)

```
oslicense [<args>] [<license-id>]
```

Automatically generates a license file (`'LICENSE.md'`) or outputs license text for a given OSI license ID. If a `package.json` file with a `license` property is present, that license ID will be used. `package.json` lookup will start with the current working directory, checking all parent directories until a `package.json` file is found.

The `<license-id>` argument (case-sensitive) must match one of the license IDs returned using the `--list` flag.

The generated license file may have placeholders for license holder names, dates, etc. that will need to be replaced manually.

## CLI Arguments

### -h, --help

Shows CLI help text.

### -l, --list

Lists all available OSI licenses and license IDs.

```
License-ID-01:
    License 01 Name

License-ID-02:
    License 02 Name

...
```

### -o, --output \<path\>

Specifies an alternate output file name and/or directory for the generated license file. Relative paths are relative to the current working directory.

If `<path>` is a directory, then the license file will be created with the default file name in the directory.

### -s, ---stdout

Prints license text to stdout instead of generating a license file. If specified, the `--output` flag will be ignored.

## Usage (Module)

```js
const osl = require("oslicense");

(async () => {
    try {
        // Get object containing all available OSI licenses, keyed by license ID
        console.log(await osl.getLicenses());
        
        // Get license metadata for a specific license ID
        console.log(await osl.getLicenseData("MIT"));
        
        // Get license text for a specific license ID or license object from
        // getLicenseData()
        console.log(await osl.getLicenseText("MIT"));
    }
    catch (e) {
        console.error(e);
    }
})();
```
