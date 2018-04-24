import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
@Injectable()


export class AdminService {
  private baseURL = 'http://localhost:3000/api/';
  private removePublishedStudyPlansURL = 'admin/removePublishedStudyPlan/';
  private viewPendingStudyPlanPublishReqsURL = 'admin/PendingStudyPlanPublishRequests';
  private respondStudyPlanPublishRequestURL = 'admin/RespondStudyPlanPublishRequest/';
  private viewPendingContReqsURL = 'admin/PendingContentRequests/';
  private respondContentRequestURL = 'admin/RespondContentRequest/';
  private respondContentStatusURL = 'admin/RespondContentStatus/';
  private getContent = 'admin/getContent/';
  private URL = 'http://localhost:3000/api/admin/';
  private addContributionPtsURL = 'admin/addContPts';
  private reportUrl= '/getReports';


  constructor(private http: HttpClient) {
  }

  respondToContributerValidationRequest(id, resp): any {
    /*
      @author: MAHER.
      respond the requests.
   */
    console.log('the Responce is sent el mafrood AUTHOR: Maher');
    return this.http.patch(
      this.URL + 'VerifiedContributerRequestRespond/' + id,
      {responce: resp}
    ).subscribe();
  }

  viewPendingVCR(FilterBy): any {
    /*
      @author: MAHER.
      gets the requests.
   */
    return this.http.get(this.URL + 'VerifiedContributerRequests/' + FilterBy);
  }

  viewPendingContReqs(type): any {
    const self = this;
    return this.http.get<any>(this.baseURL + this.viewPendingContReqsURL + type)
      .pipe(
        catchError(
          self.handleError('viewPendingContReqs', [])
        )
      );
  }

  respondContentRequest(response, rid, cid, cresponse, username, oldscore): any {
    const self = this;
    return this.http.patch<any>(this.baseURL + this.respondContentRequestURL + rid + '/' + cid ,
    { str: response, approved: cresponse, userName: username, oldScore: oldscore })
      .pipe(
        catchError(
          self.handleError('respondContentRequest', [])
        )
      );
  }
getcontent(): any {
    const self = this;
    return this.http.get<any>(this.baseURL + this.getContent)
      .pipe(
        catchError(
          self.handleError('getContent', [])
        )
      );
  }

  // create a category for content (resrouces and ideas) to be classified into
  createCategory(category: any): Observable<any> {
    const self = this;
    return this.http.post(self.baseURL + 'content/category', category)
      .pipe(
        catchError(
          self.handleError('createCategory', [])
        )
      );
  }

  // create a section for content (resources and ideas) to be classified into
  createSection(categoryId: any, section: any): Observable<any> {
    const self = this;
    return this.http.post(self.baseURL + 'content/category/' + categoryId + '/section', section)
      .pipe(
        catchError(
          self.handleError('createSection', [])
        )
      );
  }
  removePublishedStudyPlans(studyPlanId: any): Observable<any> {
    const self = this;
    return this.http.get(self.baseURL + self.removePublishedStudyPlansURL + studyPlanId)
      .pipe(
        catchError(
          self.handleError('removePublishedStudyPlan', [])
        )
      );
  }
  viewStudyPlanPublishReqs(): Observable<any> {
    const self = this;
    return this.http.get(self.baseURL + self.viewPendingStudyPlanPublishReqsURL)
      .pipe(
        catchError(
          self.handleError('viewStudyPlanPublishReqs', [])
        )
      );
  }
  respondStudyPlanPublishReqs(respo, id, sid): Observable<any> {
    const self = this;
    return this.http.patch<any>(self.baseURL + self.respondStudyPlanPublishRequestURL + id + '/' + sid,  respo)
      .pipe(
        catchError(
          self.handleError('respondContentRequest', [])
        )
      );
  }
  // TO-DO ContributionPts
  // addContPts(userName: any ): any {
  //   const self = this;
  //   return this.http.patch<any>(self.baseURL + self.addContributionPtsURL , { username: userName })
  //   .pipe(
  //     catchError(
  //       self.handleError('AddContributionPts', [])
  //     )
  //   );
  // }

  // general error handler
  private handleError<T>(operation = 'operation', result?: T) {

    return function (error: any): Observable<T> {

      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  getReports(): any {
    const self = this;
    return this.http.get<any>(this.URL+this.reportUrl, httpOptions);

  }
}
