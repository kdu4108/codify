import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Camera, CameraOptions } from "@ionic-native/camera";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {


  // const options: CameraOptions = {
  //   quality: 100,
  //   destinationType: this.camera.DestinationType.FILE_URI,
  //   encodingType: this.camera.EncodingType.JPEG,
  //   mediaType: this.camera.MediaType.PICTURE
  // }
  public base64Image: string;
  public ipAddress: string;
  constructor(public navCtrl: NavController, private camera: Camera) {
    this.ipAddress = "";
  }


  takePhoto() {
    const options: CameraOptions = {
      quality: 50,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }

    this.camera.getPicture(options).then((imageData) => {
      this.base64Image = "data:image/jpeg;base64," + imageData;
      if (true) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://192.168.43.23:8080/image", true);
        xhr.setRequestHeader("Content-Type", "text/plain");
        var imgObject = {
          img: this.base64Image,
          ip: this.ipAddress
        }
        var imgString = JSON.stringify(imgObject);
        xhr.onload = function() {
          console.log(xhr.responseText);
        }
        xhr.send(imgString);

      }
    }, (err) => {
      console.log(err);
    });
  }
  // this.camera.getPicture(options).then((imageData) => {
  //   let base64Image = "data:image/jpeg;base64," + imageData;
  // });



}
