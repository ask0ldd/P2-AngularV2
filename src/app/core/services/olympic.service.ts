import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Olympic } from '../models/Olympic';
import { Participation } from '../models/Participation';
import { ILineChartsDatas } from './ILineChartsDatas';

@Injectable({
  providedIn: 'root',
})
export class OlympicService {
  private olympicUrl = './assets/mock/olympic.json';
  private olympics$ = new BehaviorSubject<any>(undefined);
  // private olympics$ = new ReplaySubject<any>(undefined);

  constructor(private http: HttpClient) {}

  loadInitialData() {
    return this.http.get<any>(this.olympicUrl).pipe(
      tap((value) => this.olympics$.next(value)),
      catchError((error, caught) => {
        // TODO: improve error handling
        console.error(error);
        // can be useful to end loading state and let the user know something went wrong
        // this.olympics$.next(null);
        this.olympics$.error("Can't load the Datas.")
        this.olympics$.complete()
        return caught;
      })
    );
  }

  getOlympics$() {
    return this.olympics$.asObservable();
  }

  // using find - rxjs operator - : ignore emissions not matching my condition, 
  // map - rxjs operator - : work on successive emissions
  // it wouldn't allow me to find the first ICountryJOStats matching it
  getCountryMedals$(country : string) : Observable<number>{
    return this.getOlympics$().pipe( // !!! catch error
        map((datas : Olympic[]) => datas
        .find((datas : Olympic) => datas.country.toLowerCase() === country)?.participations
        .reduce((accumulator : number, participation : Participation) => accumulator + participation.medalsCount, 0) || 0
        )
    )
  }

  getCountryTotalAthletes$(country : string) : Observable<number>{
    return this.getOlympics$().pipe(
        map((datas : Olympic[]) => datas
        .find((datas : Olympic) => datas.country.toLowerCase() === country)?.participations
        .reduce((accumulator : number, participation : Participation) => accumulator + participation.athleteCount, 0) || 0
        )
    )
  }

  getCountryLineChartDatas$(country : string) : Observable<ILineChartsDatas>{
    return this.getOlympics$().pipe(
        map((datas : Olympic[]) => {
          const selectedCountryDatas = datas.find((datas) => datas.country.toLowerCase() === country)
          if(selectedCountryDatas) return {name: country, series: selectedCountryDatas?.participations.map(participation => ({name : participation.year.toString(), value : participation.medalsCount}))}
          return {name : country, series : [{name : '', value : 0 }]}
        })
    )
  }

  getPieChartDatas$() : Observable<{name : string, value : number} []>{
    return this.getOlympics$().pipe(
      map((datas : Olympic[]) => datas
        ?.map((countryDatas : Olympic) => ({name : countryDatas.country, value : countryDatas?.participations.reduce((accumulator : number, participation : Participation) => accumulator + participation.medalsCount, 0)}))
      )
    )
  }

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
