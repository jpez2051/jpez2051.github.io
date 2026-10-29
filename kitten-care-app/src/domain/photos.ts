import type {CareState} from './models';
export function updateKittenPhoto(state:CareState,kittenId:string,photo:string|null,expectedPhoto:string|null):CareState{
 const kitten=state.kittens.find(k=>k.id===kittenId);
 if(!kitten)throw new Error('This kitten no longer exists. Reopen its profile.');
 if(kitten.photo!==expectedPhoto)throw new Error('This photo changed in another tab. Reopen the photo editor before saving.');
 return {...state,kittens:state.kittens.map(k=>k.id===kittenId?{...k,photo}:k)};
}
