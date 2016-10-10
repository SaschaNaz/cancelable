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
task("test", () => {
    jake.exec(["mocha"], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("default");
task("default", () => {

});