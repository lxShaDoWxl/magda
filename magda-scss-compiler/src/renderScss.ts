import * as sass from "node-sass";
import * as cleancss from "clean-css";
import * as tempy from "tempy";
import * as fse from "fs-extra";
import * as escapeStringRegexp from "escape-string-regexp";
import * as postcss from "postcss";
import * as autoprefixer from "autoprefixer";

export const renderScssData = (clientRoot: string, data: string) => {
    return new Promise((resolve, reject) => {
        sass.render(
            {
                data,
                includePaths: [clientRoot + "/src"],
                importer: (url, prev, done) => {
                    // --- adjust the path to `node_modules`
                    // --- and if it's a .css file then read it manually to avoid the warning
                    // --- the warning will be fixed in node-sass 4.10 (not yet availble)
                    // --- https://github.com/sass/node-sass/issues/2362
                    if (!url.match(/^[\.\/]*node_modules/i)) {
                        done({ file: url });
                    } else {
                        const targetPath = url.replace(
                            /^[\.\/]*node_modules/i,
                            clientRoot + "/../.."
                        );
                        if (targetPath.match(/\.(css|scss)$/)) {
                            done({
                                contents: fse.readFileSync(targetPath, {
                                    encoding: "utf-8"
                                })
                            });
                        } else {
                            done({
                                file: targetPath
                            });
                        }
                    }
                }
            },
            (error, result) => {
                if (!error) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
    })
        .then((result: sass.Result) => {
            return postcss([autoprefixer])
                .process(result.css.toString("utf-8"), {
                    //--- from & to are name only used for sourcemap
                    from: "node-sass-raw.css",
                    to: "stylesheet.css"
                })
                .then(function(result) {
                    result.warnings().forEach(function(warn) {
                        console.warn(warn.toString());
                    });
                    return result.css;
                });
        })
        .then((css: string) => {
            const cssOption: any = { returnPromise: true };
            return new cleancss(cssOption).minify(css);
        })
        .then(cssResult => cssResult.styles);
};

export const renderScssFiles = async (
    clientRoot: string,
    files: string[],
    params: object = {}
) => {
    return await renderScssData(
        clientRoot,
        files.map((file: string) => `@import "${file}";`).join("")
    );
};

export const replaceParamsFromScss = (data: string, params: any = {}) => {
    let result = data;
    Object.keys(params).forEach(key => {
        const varName = escapeStringRegexp(key);
        const regex = new RegExp(`\\$${varName}:[^;]+;`, "img");
        result = result.replace(regex, `$${key}: ${params[key]};`);
    });
    return result;
};

export const renderScssFilesExtra = async (
    clientRoot: string,
    orgIdxfile: string,
    orgVarFile: string,
    otherfiles: string[],
    params: object = {}
) => {
    const varFileContent: string = await fse.readFile(orgVarFile, {
        encoding: "utf-8"
    });
    const varFile = tempy.file();
    await fse.writeFile(varFile, replaceParamsFromScss(varFileContent, params));
    const idxFileContent: string = await fse.readFile(orgIdxfile, {
        encoding: "utf-8"
    });
    const indexFile = tempy.file();
    await fse.writeFile(
        indexFile,
        idxFileContent.replace(`@import "variables";`, "")
    );

    otherfiles.unshift(indexFile);
    otherfiles.unshift(varFile);
    return await renderScssData(
        clientRoot,
        otherfiles.map((file: string) => `@import "${file}";`).join("")
    );
};
