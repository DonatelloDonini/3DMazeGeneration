class Debugger{
  constructor(testingEnabled= false, infoEnabled= false, warningsEnabled= false){
    this.testingEnabled= testingEnabled;
    this.infoEnabled= infoEnabled;
    this.warningsEnabled= warningsEnabled;
  }

  test(successMessage, failMessage, test){
    if (! this.testingEnabled) return;
    if (test()){
      console.log(`%c[ PASS ]\t${successMessage}`, "color: lime");
    }
    else {
      console.log(`%c[ FAIL ]\t${failMessage}`, "color: red");
    }
  }
  
  logInfo(message){
    if (! this.infoEnabled) return;

    console.log(`%c[ INFO ]\t${message}`, "color: white");
  }
  
  logWarning(message){
    if (! this.warningsEnabled) return;

    console.log(`%c[ WARN ]\t${message}`, "color: orange");
  }

  separator(){
    console.log("------------");
  }

  enableTesting(){
    this.testingEnabled= true;
  }

  enableInfo(){
    this.infoEnabled= true;
  }

  enableWarning(){
    this.warningsEnabled= true;
  }

  disableTesting(){
    this.testingEnabled= false;
  }
  
  disableInfo(){
    this.infoEnabled= false;
  }
  
  disableWarning(){
    this.warningsEnabled= false;
  }
}

export default Debugger;