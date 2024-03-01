import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject, Subject, of, throwError } from 'rxjs';
import { catchError, delay, map, take, takeUntil, tap } from 'rxjs/operators';
import { IOlympic } from '../models/IOlympic';
import { IParticipation } from '../models/IParticipation';
import { ILineChartsDatas } from './interfaces/ILineChartsDatas';

@Injectable({
  providedIn: 'root',
})
export class OlympicService {
  
  private olympicUrl = './assets/mock/olympic.json'
  private olympics$ = new ReplaySubject<IOlympic[]>() // repeat value despite take(1) in app component
  // private olympics$ = new BehaviorSubject<any>(undefined);
  private unsubscribe$: Subject<void> = new Subject<void>() // when .complete() => end http.get loading process
  private isLoadingError$ = new BehaviorSubject<boolean>(false)
  private isLoading$ = new BehaviorSubject<boolean>(false) // why behavior & not of()

  constructor(private http: HttpClient) {}

  loadInitialData() {
    this.isLoading$.next(true)
    return this.http.get<IOlympic[]>(this.olympicUrl).pipe(takeUntil(this.unsubscribe$)).pipe( // takeuntil : control loading state
      delay(2000),
      tap((value) => {
        this.olympics$.next(value)
        // loading obs off
        this.isLoading$.next(false)
        this.isLoading$.complete()
      }),
      catchError((error, caught) => {
        // loading obs off
        this.isLoading$.next(false)
        this.isLoading$.complete()
        // loading error obs on
        this.isLoadingError$.next(true)
        this.isLoadingError$.complete()
        this.olympics$.next([]) // triggering take(1)
        this.olympics$.complete()
        // end loading process
        this.unsubscribe$.next()
        this.unsubscribe$.complete()
        // return caught;
        if (error.status === 404) {
          return throwError(() => new Error('File not found. Please check the file path.'));
        } else {
          return throwError(() => new Error("An error occurred: " + error.message));
        }
      })
    );
  }

  getLoadingErrorStatus$() : Observable<boolean>{
    return this.isLoadingError$.asObservable()
  }

  getLoadingStatus$() : Observable<boolean>{
    return this.isLoading$.asObservable()
  }

  // return the json file content as an observable
  getOlympics$() : Observable<IOlympic[]> {
    return this.olympics$.asObservable()
  }

  // find - rxjs operator - : ignore emissions not matching my condition, 
  // map - rxjs operator - : work on successive emissions
  // wouldn't allow me to find the first ICountryJOStats matching a condition
  getCountryMedals$(country : string) : Observable<number>{
    return this.getOlympics$().pipe( // !!! catch error
        map((datas : IOlympic[]) => datas
        .find((datas : IOlympic) => datas.country.toLowerCase() === country)?.participations
        .reduce((accumulator : number, participation : IParticipation) => accumulator + participation.medalsCount, 0) || 0
        ),
        catchError((error) => {
          console.error('An error occurred while fetching country medals:', error);
          return throwError(() => new Error('Error occurred while fetching country medals'));
        })
    )
  }

  // return the number of participants for a specific country as an observable
  getCountryTotalAthletes$(country : string) : Observable<number>{
    return this.getOlympics$().pipe(
        map((datas : IOlympic[]) => datas
        .find((datas : IOlympic) => datas.country.toLowerCase() === country)?.participations
        .reduce((accumulator : number, participation : IParticipation) => accumulator + participation.athleteCount, 0) || 0
        ),
        catchError((error) => {
          console.error('An error occurred while fetching country medals:', error);
          return throwError(() => new Error('Error occurred while fetching country medals'));
        })
    )
  }

  // return all the formated datas to populate the linechart for a specific country as an observable
  getCountryLineChartDatas$(country : string) : Observable<ILineChartsDatas | undefined>{
    return this.getOlympics$().pipe(
        map((datas : IOlympic[]) => {
          const selectedCountryDatas = datas.find((datas) => datas.country.toLowerCase() === country)
          if(selectedCountryDatas) return {name: country, series: selectedCountryDatas?.participations.map(participation => ({name : participation.year.toString(), value : participation.medalsCount}))}
          return undefined
        }),
        catchError((error) => {
          console.error('An error occurred while fetching country medals:', error);
          return throwError(() => new Error('Error occurred while fetching country medals'));
        })
    )
  }

  // return all the formated datas to populate the homepage pie chart as an observable
  getPieChartDatas$() : Observable<{name : string, value : number} []>{
    return this.getOlympics$().pipe(
      map((datas : IOlympic[]) => datas
        ?.map((countryDatas : IOlympic) => ({name : countryDatas.country, value : countryDatas?.participations.reduce((accumulator : number, participation : IParticipation) => accumulator + participation.medalsCount, 0)}))
      ),
      catchError((error) => {
        console.error('An error occurred while fetching country medals:', error);
        return throwError(() => new Error('Error occurred while fetching country medals'));
      })
    )
  }

  // return the total number of JOs in the JSON as an observable
  getNumberOfJOs$() : Observable<number>{
    // return of(0)
    return this.getOlympics$().pipe(
      map((datas : IOlympic[]) => {
          let eventsDates : number[] = []
          datas.forEach(countryStats => {
            countryStats.participations.forEach(participation => {
              if(!eventsDates.includes(participation.year)) eventsDates.push(participation.year)
            })
          })
          return eventsDates.length
        } 
      ),
      catchError((error) => {
        console.error('An error occurred while fetching country medals:', error);
        return throwError(() => new Error('Error occurred while fetching country medals'));
      })
    )
  }
}


/*

https://angular.io/guide/http-handle-request-errors

*/