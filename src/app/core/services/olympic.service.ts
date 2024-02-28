import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { catchError, map, takeUntil, tap } from 'rxjs/operators';
import { Olympic } from '../models/Olympic';
import { Participation } from '../models/Participation';
import { ILineChartsDatas } from './interfaces/ILineChartsDatas';

@Injectable({
  providedIn: 'root',
})
export class OlympicService {
  private olympicUrl = './assets/mock/olympic.json';
  // private olympics$ = new BehaviorSubject<any>(undefined);
  private olympics$ = new ReplaySubject<any>(undefined); // display detail even when refreshing browser, not happening with behavior; check why
  private unsubscribe$: Subject<void> = new Subject<void>() // when .complete() => end http.get loading state


  constructor(private http: HttpClient) {}

  loadInitialData() {
    return this.http.get<any>(this.olympicUrl).pipe(takeUntil(this.unsubscribe$)).pipe( // takeuntil : control loading state
      tap((value) => this.olympics$.next(value)),
      catchError((error, caught) => {
        // ??? memo : error handling could be improved ? => look at the bottom of the page
        console.error(error)
        this.olympics$.error("Can't load the Datas.")
        this.olympics$.complete()
        // end loading state
        this.unsubscribe$.next()
        this.unsubscribe$.complete()
        return caught;
      })
    );
  }

  // return the json file content as an observable
  getOlympics$() {
    return this.olympics$.asObservable();
  }

  // find - rxjs operator - : ignore emissions not matching my condition, 
  // map - rxjs operator - : work on successive emissions
  // wouldn't allow me to find the first ICountryJOStats matching a condition
  getCountryMedals$(country : string) : Observable<number>{
    return this.getOlympics$().pipe( // !!! catch error
        map((datas : Olympic[]) => datas
        .find((datas : Olympic) => datas.country.toLowerCase() === country)?.participations
        .reduce((accumulator : number, participation : Participation) => accumulator + participation.medalsCount, 0) || 0
        )
    )
  }

  // return the number of participants for a specific country as an observable
  getCountryTotalAthletes$(country : string) : Observable<number>{
    return this.getOlympics$().pipe(
        map((datas : Olympic[]) => datas
        .find((datas : Olympic) => datas.country.toLowerCase() === country)?.participations
        .reduce((accumulator : number, participation : Participation) => accumulator + participation.athleteCount, 0) || 0
        )
    )
  }

  // return all the formated datas to populate the linechart for a specific country as an observable
  getCountryLineChartDatas$(country : string) : Observable<ILineChartsDatas>{
    return this.getOlympics$().pipe(
        map((datas : Olympic[]) => {
          const selectedCountryDatas = datas.find((datas) => datas.country.toLowerCase() === country)
          if(selectedCountryDatas) return {name: country, series: selectedCountryDatas?.participations.map(participation => ({name : participation.year.toString(), value : participation.medalsCount}))}
          return {name : country, series : [{name : '', value : 0 }]}
        })
    )
  }

  // return all the formated datas to populate the homepage pie chart as an observable
  getPieChartDatas$() : Observable<{name : string, value : number} []>{
    return this.getOlympics$().pipe(
      map((datas : Olympic[]) => datas
        ?.map((countryDatas : Olympic) => ({name : countryDatas.country, value : countryDatas?.participations.reduce((accumulator : number, participation : Participation) => accumulator + participation.medalsCount, 0)}))
      )
    )
  }

  // return the total number of JOs in the JSON as an observable
  getNumberOfJOs$() : Observable<number>{
    return this.getOlympics$().pipe(
      map((datas : Olympic[]) => {
          let eventsDates : number[] = []
          datas.forEach(countryStats => {
            countryStats.participations.forEach(participation => {
              if(!eventsDates.includes(participation.year)) eventsDates.push(participation.year)
            })
          })
          return eventsDates.length
        } 
      )
    )
  }
}


/*

https://angular.io/guide/http-handle-request-errors

private handleError(error: HttpErrorResponse) {
  if (error.status === 0) {
    // A client-side or network error occurred. Handle it accordingly.
    console.error('An error occurred:', error.error);
  } else {
    // The backend returned an unsuccessful response code.
    // The response body may contain clues as to what went wrong.
    console.error(
      `Backend returned code ${error.status}, body was: `, error.error);
  }
  // Return an observable with a user-facing error message.
  return throwError(() => new Error('Something bad happened; please try again later.'));
}

*/