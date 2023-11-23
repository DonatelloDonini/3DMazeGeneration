class Debugger{
  constructor(enableTesting, enableInfo, enableWarning){
    this.enableTesting= enableTesting;
    this.enableInfo= enableInfo;
    this.enableWarning= enableWarning;
  }

  test(successMessage, failMessage, test){
    if (! this.enableTesting) return;
    if (test()){
      console.log(`%c[ PASS ]\t${successMessage}`, "color: lime");
    }
    else {
      console.log(`%c[ FAIL ]\t${failMessage}`, "color: red");
    }
  }
  
  logInfo(message){
    if (! this.enableInfo) return;

    console.log(`%c[ INFO ]\t${message}`, "color: white");
  }
  
  logWarning(message){
    if (! this.enableWarning) return;

    console.log(`%c[ WARN ]\t${message}`, "color: yellow");
  }

  separator(){
    console.log("------------");
  }
}

export default Debugger;