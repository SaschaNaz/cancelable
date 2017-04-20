const mz = require("mz/fs");
const ignore = require("ts-module-ignore").default;

var jakeExecOptionBag = {
    printStdout: true,
    printStderr: true
};

function asyncExec(cmds) {
    return new Promise((resolve, reject) => {
        try {
            jake.exec(cmds, () => resolve(), jakeExecOptionBag)
        }
        catch (e) {
            reject(e);
        }
    });
}

desc("buildtest");
task("buildtest", async () => {
    await asyncExec(["tsc -p testsources/"]);
});

desc("test");
task("test", ["buildcommonjs", "buildtest"], async () => {
    await asyncExec(["mocha"]);
});

desc("buildglobal");
task("buildglobal", async () => {
    await ignore("sources/cancelable.ts", "temp/cancelable.ts");
    await mz.writeFile("temp/tsconfig.json", await mz.readFile("sources/tsconfig.json"));
    await asyncExec(["tsc -p temp/ -outDir built/global/"]);

    await mz.unlink("temp/tsconfig.json");
    await mz.unlink("temp/cancelable.ts");
    await mz.rmdir("temp/")
});

desc("buildnative");
task("buildnative", async () => {
    await asyncExec(["tsc -p sources/ -outDir built/native/"]);
});

desc("buildcommonjs");
task("buildcommonjs", async () => {
    await asyncExec(["tsc -p sources/ -module commonjs -outDir built/commonjs/"]);
});

desc("buildsystemjs");
task("buildsystemjs", async () => {
    await asyncExec(["tsc -p sources/ -module system -outDir built/systemjs/"]);
});

desc("build");
task("build", ["buildglobal", "buildnative", "buildcommonjs", "buildsystemjs"], () => {

});

desc("default");
task("default", ["build"], () => {

});