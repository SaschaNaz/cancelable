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
task("build", ["buildnative", "buildcommonjs", "buildsystemjs"], () => {

});

desc("default");
task("default", ["build"], () => {

});