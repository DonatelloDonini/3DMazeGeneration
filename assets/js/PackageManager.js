import { LostPackageError } from "./CustomErrors";

class PackageManager{
  constructor(){
    this.packageIndex= 0;
  }

  checkPackage(robotMessage){
    if (robotMessage.id!== this.packageIndex) throw new LostPackageError();
    this.packageIndex++;
  }
}

export default PackageManager;