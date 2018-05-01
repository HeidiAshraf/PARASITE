
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Location } from '@angular/common';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

declare const $: any;

@Component({
  selector: 'app-child-signup',
  templateUrl: './child-signup.component.html',
  styleUrls: ['./child-signup.component.scss']
})
export class ChildSignupComponent implements OnInit {
  constructor(private location: Location, private authService: AuthService,
    private toastrService: ToastrService, private router: Router) { }
  Firstname: String = '';
  Lastname: String = '';
  Username: String = '';
  Password: String = '';
  ConfirmPassword: String = '';
  Email: String = '';
  Address: String = '';
  Birthdate: Date;
  Phone: [String] = [''];
  Div1 = false;
  Div2 = false;
  Div3 = false;
  AllisWell: Boolean = true;
  User: any;
  private done = false;
  Educational_level: String = '';
  Educational_system: String = '';
systems: any = ['Thanaweya Amma', 'IGCSE', 'American Diploma'];
levels: any = ['KG', 'Primary School', 'Middle School', 'High School'];

  ngOnInit() {
const self = this;
    $('.datetimepicker').bootstrapMaterialDatePicker({
      clearButton: true,
      format: 'DD MMMM YYYY',
      maxDate: new Date(),
      shortTime: true,
      time: false
    });

    $('#birthdate').bootstrapMaterialDatePicker().on('change', function (event, date) {
      if (date) {
        self.Birthdate = date._d;
      }
    });
  }

  register(): void {
    const self = this;
    if (this.AllisWell) {
   //   console.log('birthdate: ', self.Birthdate);
    //  console.log('educationSystem ', self.Educational_system);
    //  console.log('educationLevel ', self.Educational_level );
            this.User = { 'firstName': this.Firstname, 'lastName': this.Lastname, 'username': this.Username, 'password': this.Password,
      'birthdate': this.Birthdate, 'email': this.Email, 'phone': this.Phone,
       'address': this.Address, 'educationLevel': self.Educational_level, 'educationSystem': self.Educational_system};
      self.authService.childSignUp(this.User).subscribe(function (res) {
         this.Div3 = true;
         if ( res.msg ) {
            self.toastrService.success(res.msg);
        //    self.router.navigate(['/']);
           }
       });
    }// end if
   //  this.location.back();
  }// end method


  showPersonalInfoTab(): void {
    $('#personalInfo').prop('hidden', false);
    $('#credentials').prop('hidden', true);
    $('#prevTab').prop('disabled', true);
    $('#nextTab').prop('value', 'Next');
    this.done = false;
  }

  showCredentialsTab(): void {
    const self = this;
    if (this.done) {
      $('#nextTab').attr('onclick', function () {
        self.register();
      });
    }
    $('#personalInfo').prop('hidden', true);
    $('#credentials').prop('hidden', false);
    $('#prevTab').prop('disabled', false);
    $('#nextTab').prop('value', 'Sign Up');
    this.done = true;
  }

  systemIs(sys): void {
    const self = this;
  //  console.log('entered sys meth');
        self.Educational_system = sys;
        self.toastrService.success('Education System selected ', sys );
    //    console.log(self.Educational_system);
  }

  levelIs(lev): void {
    const self = this;
  //  console.log('entered lev meth');
        self.Educational_level = lev;
        self.toastrService.success('Eduacation Level selected ', lev);
    //    console.log(self.Educational_level);
  }
}
