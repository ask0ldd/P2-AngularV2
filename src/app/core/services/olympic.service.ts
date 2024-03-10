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
  private olympics$ = new BehaviorSubject<IOlympic[]>([]);
  private unsubscribe$: Subject<void> = new Subject<void>() // when .complete() => end http.get loading process
  private isLoadingError$ = new BehaviorSubject<boolean>(false)
  private isLoading$ = new BehaviorSubject<boolean>(false) // why behavior & not of()

  constructor(private http: HttpClient) {}

  /**
   * Loads initial data from the specified URL and handles loading states and errors.
   * @returns {Observable<IOlympic[]>} An observable of type IOlympic[] containing the loaded data.
   */
  loadInitialData() : Observable<IOlympic[]> {
    this.isLoading$.next(true)
    return this.http.get<IOlympic[]>(this.olympicUrl).pipe(takeUntil(this.unsubscribe$)).pipe( // takeuntil : control loading state
      delay(600),
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
        // return caught
        if (error.status === 404) {
          return throwError(() => new Error('File not found. Please check the file path.'))
        } else {
          return throwError(() => new Error("An error occurred: " + error.message))
        }
      })
    );
  }

  /**
   * Retrieves the loading error status as an Observable<boolean>.
   * @returns {Observable<boolean>} An Observable that emits a boolean value indicating the loading error status.
   */
  getLoadingErrorStatus$() : Observable<boolean>{
    return this.isLoadingError$.asObservable()
  }

  /**
   * Retrieves the loading status as an Observable<boolean>.
   * @returns {Observable<boolean>} An Observable that emits a boolean value indicating the loading status.
   */
  getLoadingStatus$() : Observable<boolean>{
    return this.isLoading$.asObservable()
  }

  /**
  *  Returns the JSON file content as an observable.
  *  @returns {Observable<IOlympic[]>} An observable of type IOlympic[] containing the JSON file content.
  */
  getOlympics$() : Observable<IOlympic[]> {
  return this.olympics$.asObservable()
  }

  // find - rxjs operator - : ignore emissions not matching my condition, 
  // map - rxjs operator - : work on successive emissions
  // wouldn't allow me to find the first ICountryJOStats matching a condition
  /**
   * Retrieves the total number of medals won by a specific country.
   * 
   * @param {string} country - The name of the country to retrieve the total medals for.
   * @returns {Observable<number>} An observable that emits the total number of medals won by the country.
   */
  getCountryMedals$(country : string) : Observable<number>{
    return this.olympics$.pipe(
        map((datas : IOlympic[]) => datas
        .find((datas : IOlympic) => datas.country.toLowerCase() === country)?.participations
        .reduce((accumulator : number, participation : IParticipation) => accumulator + participation.medalsCount, 0) || 0
        ),
        catchError((error) => {
          console.error('An error occurred while fetching country medals:', error)
          return throwError(() => new Error('Error occurred while fetching country medals'))
        })
    )
  }

  /**
   * Retrieves the total number of athletes from a specific country.
   * @param {string} country - The name of the country to retrieve the total athletes for.
   * @returns {Observable<number>} An observable that emits the total number of athletes from the specified country.
   */
  getCountryTotalAthletes$(country : string) : Observable<number>{
    return this.olympics$.pipe(
        map((datas : IOlympic[]) => datas
        .find((datas : IOlympic) => datas.country.toLowerCase() === country)?.participations
        .reduce((accumulator : number, participation : IParticipation) => 
          accumulator + participation.athleteCount, 0) || 0
        ),
        catchError((error) => {
          console.error('An error occurred while fetching the total of athletes:', error)
          return throwError(() => new Error('Error occurred while fetching the total of athletes'))
        })
    )
  }

  /**
   * Retrieves & Format all the datas to populate the linechart for a specific country.
   * @param {string} country - The name of the country to retrieve data for.
   * @returns {Observable<ILineChartsDatas | undefined>} An observable that emits the line chart data for the specified country or undefined if not found.
   */
  getCountryLineChartDatas$(country : string) : Observable<ILineChartsDatas | undefined>{
    return this.olympics$.pipe(
        map((datas : IOlympic[]) => {
          const selectedCountryDatas = datas.find((datas) => datas.country.toLowerCase() === country)
          if(selectedCountryDatas) return {
            name: country, 
            series: selectedCountryDatas?.participations.map(participation => (
              {
                name : participation.year.toString(), 
                value : participation.medalsCount
              }
            ))}
          return undefined
        }),
        catchError((error) => {
          console.error('An error occurred while fetching the line chart datas:', error)
          return throwError(() => new Error('Error occurred while fetching the line chart datas'))
        })
    )
  }

  /**
   * Retrieves & Format all the datas to populate the homepage pie chart.
   * @returns {Observable<{name: string, value: number}[]>} An Observable of objects containing all the datas to populate the homepage pie chart.
   */
  getPieChartDatas$() : Observable<{name : string, value : number} []>{
    return this.olympics$.pipe(
      map((datas : IOlympic[]) => datas
        ?.map((countryDatas : IOlympic) => ({
          name : countryDatas.country, 
          value : countryDatas?.participations.reduce((accumulator : number, participation : IParticipation) => 
            accumulator + participation.medalsCount, 0)
        }))
      ),
      catchError((error) => {
        console.error('An error occurred while fetching the pie chart datas:', error);
        return throwError(() => new Error('Error occurred while fetching the pie chart datas'));
      })
    )
  }

  /**
   * Return the total number of JOs in the JSON.
   * @returns {Observable<number>} An observable that emits the number of unique years of Olympic events.
   */
  getNumberOfJOs$() : Observable<number>{
    return this.olympics$.pipe(
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
        console.error('An error occurred while fetching the number of JOs :', error)
        return throwError(() => new Error('Error occurred while fetching the number of JOs'))
      })
    )
  }
}

// https://angular.io/guide/http-handle-request-errors