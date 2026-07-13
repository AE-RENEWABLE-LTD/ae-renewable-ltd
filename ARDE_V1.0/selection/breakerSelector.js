import { breakers } from "../data/breakers.js";

export function chooseBreaker(current){

    const maximum=current*1.5;

    return breakers.find(size=>{

        return size>=current &&
               size<=maximum;

    });

}