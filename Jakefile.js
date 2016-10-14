var jakeExecOptionBag = {
    printStdout: true,
    printStderr: true,
    breakOnError: true
};

var jakeAsyncTaskOptionBag = {
    async: true
};

desc("buildtest");
task("buildtest", () => {
    jake.exec(["tsc -p testsources/"], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("test");
task("test", ["buildcommonjs", "buildtest"], () => {
    jake.exec(["mocha"], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("buildnative");
task("buildnative", () => {
    jake.exec(["tsc -p sources/ -outDir built/native/"], jakeExecOptionBag, () => {
        complete();
    })
}, jakeAsyncTaskOptionBag);

desc("buildcommonjs");
task("buildcommonjs", () => {
    jake.exec(["tsc -p sources/ -module commonjs -outDir built/commonjs/"], jakeExecOptionBag, () => {
        complete();
    })
}, jakeAsyncTaskOptionBag);

desc("buildsystemjs");
task("buildsystemjs", () => {
    jake.exec(["tsc -p sources/ -module system -outDir built/systemjs/"], jakeExecOptionBag, () => {
        complete();
    })
}, jakeAsyncTaskOptionBag);

desc("build");
task("build", ["buildnative", "buildcommonjs", "buildsystemjs"], () => {

}, jakeAsyncTaskOptionBag);

desc("default");
task("default", ["build"], () => {

});