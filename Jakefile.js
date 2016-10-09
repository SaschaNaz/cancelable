var jakeExecOptionBag = {
    printStdout: true,
    printStderr: true,
    breakOnError: true
};

var jakeAsyncTaskOptionBag = {
    async: true
};

desc("test");
task("test", () => {
    jake.exec(["mocha tests"], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("default");
task("default", () => {

});