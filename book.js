const path = require("path")
const fs = require("fs")
module.exports = {
    "root": "./docs",
    "title": "Kubebuilder制作和学习",
    "plugins": [
        "include-codeblock"
    ],
    "pluginsConfig": {
        "include-codeblock": {
            "template": path.join(__dirname,"template.hbs")
        }
    }
};
