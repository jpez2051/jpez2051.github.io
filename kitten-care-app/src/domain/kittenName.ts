import type {CareState} from './models';
export function updateKittenName(state:CareState,kittenId:string,name:string,expectedName:string):CareState{
 const kitten=state.kittens.find(k=>k.id===kittenId);
 if(!kitten)throw new Error('This kitten no longer exists. Reopen its profile.');
 if(kitten.name!==expectedName)throw new Error('This name changed in another tab. Reopen the name editor before saving.');
 const trimmed=name.trim();
 if(!trimmed)throw new Error('Enter a kitten name.');
 if(trimmed.length>120)throw new Error('Keep the kitten name to 120 characters or fewer.');
 return {...state,kittens:state.kittens.map(k=>k.id===kittenId?{...k,name:trimmed}:k)};
}
