import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../activity.service';
import { Activity, ActivityCreate, ActivityEdit } from '../activity';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ActivityEditComponent } from '../activity-edit/activity-edit.component';
import { DiscussionService } from '../../discussion.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-activity-detail',
  templateUrl: './activity-detail.component.html',
  styleUrls: ['./activity-detail.component.scss']
})
export class ActivityDetailComponent implements OnInit {
  /*
    @author: Wessam
  */
  // comments: any[];
  changingComment: any = '';
  somePlaceholder: any = 'write a comment ...';
  viewedReplies: boolean[];
  isReplying: boolean;
  commentReplyingOn: any;
  signedIn: boolean;
  toggle: String;
  canBookFor: String[];
  BookFor: string[];
  bookingUser: String;
  defaultPP: String = 'assets/images/profile-view/defaultPP.png';
isEmpty = false;

  currentUser = {
    isAdmin: false,
    verified: false,
    avatar: null,
    username: 'Mohamed Maher',
    isChild: false,
    booked: false
  };
  // updatedActivity: ActivityCreate;
  isCreator = false;
  isBooked = true;
  username = '';


  public updatedActivity: ActivityEdit = {
    name: '',
    description: null,
    bookedBy: null,
    price: null,

    fromDateTime: null,
    toDateTime: null,

    image: null,
    creator: null,
  };

  activity: Activity = {
    _id: '',
    name: '',
    description: '',
    bookedBy: [''], // userIds
    price: 0,
    creator: '',
    status: '',
    fromDateTime: null,
    toDateTime: null,
    createdAt: null,
    updatedAt: null,
    image: '',
    discussion: []
  };

  constructor(
    private route: ActivatedRoute,
    private activityService: ActivityService,
    public dialog: MatDialog,
    private discussionService: DiscussionService,
    private router: Router,
    private authService: AuthService,
    public translate: TranslateService,
    private toastrService: ToastrService
  ) { }

  ngOnInit() {
    window.scrollTo(0, 0);
    let self = this;
    self.BookFor = [''];
    self.getCurrentUser();
    self.getActivity();
    self.refreshComments(true);

    this.translate.get('ACTIVITIES.DETAIL.WRITE_COMMENT').subscribe((res: string) => {
      this.somePlaceholder = res;
    });
    this.translate.onLangChange.subscribe((event: any) => {
      this.translate.get('ACTIVITIES.DETAIL.WRITE_COMMENT').subscribe((res: string) => {
        this.somePlaceholder = res;
      });
    });

  }

  getCurrentUser() {
    let self = this;
    this.authService.getUserData([
      'username',
      'isAdmin',
      'firstName',
      'lastName',
      'avatar',
      'children',
      'isChild'
    ]).subscribe(function (res) {
      if (typeof res.data === 'undefined') {
        self.signedIn = false;
      } else {
        self.currentUser = res.data;
        self.signedIn = true;
        self.canBookFor = res.data.children;

        let id = self.route.snapshot.paramMap.get('id');
        self.activityService.getActivity(id).subscribe(function(resp) {
          if ( resp.data.bookedBy.includes(self.currentUser.username)) {
  self.currentUser.booked = true;

          }
          self.BookFor = resp.data.bookedBy;
        for (let x of self.BookFor ) {
if ( self.canBookFor.includes(x)) {
           self.canBookFor.splice(self.canBookFor.indexOf(x), 1);
}
if (self.canBookFor.length === 0) {
  self.isEmpty = true; }

      }});
    }}
    );

  }

  redirectToProfile(username: String) {
    console.log('directToProfile');
    // this.router.navigate(['/Profile/' + username]);
    // TODO: Redirect the Profile of the username.
    // AUTHOR: Maher.
  }

  onReply(id: any): any {
    let self = this;
    let element = document.getElementById('target');
    element.scrollIntoView();
    let input = document.getElementById('inputArea');
    self.somePlaceholder = 'leave a reply';
    input.focus();
    this.isReplying = true;
    this.commentReplyingOn = id;
  }

  onDelete(i: any) {
    let self = this;
    this.discussionService.deleteCommentOnActivity(this.activity._id, i).subscribe(function (err) {
      self.refreshComments(false);
    });
  }

  onDeleteReply(commentId: any, replyId: any) {
    let self = this;
    this.discussionService.deleteReplyOnCommentOnActivity(this.activity._id, commentId, replyId).subscribe(function (err) {
      self.refreshComments(false);
    });
  }

  getActivity() {
    /*
      Getting the activities from the api

      @var event: An object that gets fired by mat-paginator

      @author: Wessam
    */
    let id = this.route.snapshot.paramMap.get('id');
    let self = this;
    this.activityService.getActivity(id).subscribe(
      res => {
        this.activity = res.data;
        this.activity.discussion = this.activity.discussion.reverse();
        for (let i = 0 ; i < this.activity.discussion.length; i++) {
          this.activity.discussion[i].replies = this.activity.discussion[i].replies.reverse();
        }
        this.updatedActivity = res.data;
        if (this.activity.bookedBy.length < 1) { self.isBooked = false; }
        if (this.activity.creator === self.currentUser.username) { self.isCreator = true; }
        if (!this.activity.image) {
          this.activity.image = 'assets/images/activity-view/lam3y.png';
        }
      }
    );

  }


  refreshComments(refreshViewReplies: boolean): any {

    this.getActivity();
    if (refreshViewReplies) {
      this.viewedReplies = [];
      for (let i = 0; i < this.activity.discussion.length; i++) {
        this.viewedReplies.push(false);
      }
    }


  }

  showReply(i: number) {
    this.viewedReplies[i] = !this.viewedReplies[i];
  }


  addComment() {

    if (!this.changingComment || 0 === this.changingComment.length || !this.changingComment.trim()) {
      return;
    }
    if (this.isReplying) {
      let self = this;
      this.discussionService.postReplyOnCommentOnActivity(
        this.activity._id,
        this.commentReplyingOn,
        self.changingComment).subscribe(function (err) {
          if (err.msg !== 'reply created successfully') {
            self.refreshComments(false);
          }
          self.refreshComments(false);
          self.changingComment = '';
        });
    } else {
      let self = this;
      this.discussionService.postCommentOnActivity(this.activity._id, self.changingComment).subscribe(function (err) {
        if (err.msg === 'reply created successfully') {
        }
        self.refreshComments(false);
        self.changingComment = '';
      });
    }

  }

  cancelReplying() {
    this.isReplying = false;
    this.somePlaceholder = 'write a comment ...';
  }



  openDialog(): void { // author: Heidi
    let from = new Date(this.activity.fromDateTime).toJSON();
    let to = new Date(this.activity.toDateTime).toJSON();
    let dialogRef = this.dialog.open(ActivityEditComponent, {
      width: '700px',
      height: '520px',
      hasBackdrop: true,
      data: {
        name: this.activity.name, price: this.activity.price,
        description: this.activity.description,
        fromDateTime: from.substr(0, from.length - 1)
        , toDateTime: to.substr(0, to.length - 1)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.updatedActivity.name = result.name;
      this.updatedActivity.price = result.price;
      this.updatedActivity.description = result.description;
      this.updatedActivity.fromDateTime = new Date(result.fromDateTime).getTime();
      this.updatedActivity.toDateTime = new Date(result.toDateTime).getTime();
     // taking new values from dialog , assigning them to updatedActivity
     // and passing it to EditActivity method
       this.EditActivity(this.updatedActivity);
    });
  }



  EditActivity(activity) {
    let id = this.route.snapshot.paramMap.get('id');
    this.activityService.EditActivity(this.updatedActivity, id).subscribe(
      res => {
      }

    );
  }


  uploaded(url: string) {
    let self = this;
    let id = this.route.snapshot.paramMap.get('id');
    if (url === 'imageFailedToUpload') {
      self.translate.get('ACTIVITIES.TOASTER.TOASTER_FAIL').subscribe(
        function(translation) {
          self.toastrService.error(translation);
        }
      );
    } else if (url === 'noFileToUpload') {
      self.translate.get('ACTIVITIES.TOASTER.TOASTER_SELECT').subscribe(
        function(translation) {
          self.toastrService.error(translation);
        });

    } else {
      let upload = {
        image: url
      };
      this.activityService.EditActivityImage(upload, id).subscribe((res) => {
        if (res.data) {
          self.translate.get('ACTIVITIES.TOASTER.TOASTER_SUCCESS').subscribe(
            function(translation) {
              self.toastrService.success(translation);
            });
          this.activity.image = res.data;
        } else {
          self.translate.get('ACTIVITIES.TOASTER.TOASTER_FAIL').subscribe(
            function(translation) {
              self.toastrService.error(translation);
            });
        }
      });
    }
    document.getElementById('closeModal').click();
    document.focus();

  }

  deleteActivity() {
    this.activityService.deleteActivity(this.activity).subscribe();
    this.router.navigate([`activities`]);

  }

  bookActivity(user) {
    let self = this;
    this.authService.getUserData(['username']).subscribe(function (resp) {
      this.bookingUser = resp.data.username;

    self.activityService.bookActivity(self.activity, { username: user }).subscribe(
      res => {
self.isBooked = true;
if (user === resp.data.username) {
self.currentUser.booked = true;
 }


if (self.canBookFor.includes(user)) {
        let index = self.canBookFor.indexOf(user);
        self.canBookFor.splice(index, 1);
        self.bookingUser = null;


      }
      if (self.canBookFor.length === 0) {
        self.isEmpty = true; }
        self.translate.get('ACTIVITIES.DETAIL.BOOK_SUCCESS').subscribe((res: string) => {
          self.toastrService.success(res);
        });
    }

    ); });
  }



}
