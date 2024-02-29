import { IParticipation } from "./IParticipation";

export interface IOlympic {
    id: number,
    country: string,
    participations : IParticipation[],
}