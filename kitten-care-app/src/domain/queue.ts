import { activeKittens, isSameLocalDay, kittenEvents, nextFeedingAt } from './care';
import { medicationScheduleIssue, nextMedicationDue } from './schedule';
import type { CareEventType, CareState, Kitten } from './models';

export interface QueueItem { id:string; kitten:Kitten; type:CareEventType; text:string; due:Date|null; medId?:string; review?:boolean }
export function careQueue(state:CareState,now=new Date()):QueueItem[] {
  const items:QueueItem[]=[];
  for(const kitten of activeKittens(state)){
    const feed=nextFeedingAt(state,kitten);
    if(feed&&feed.getTime()<=now.getTime()+3600000)items.push({id:`feed-${kitten.id}`,kitten,type:'feeding',text:feed.getTime()===0?'No successful feeding recorded':feed<=now?'Feeding overdue':'Feeding due within one hour',due:feed});
    const weights=kittenEvents(state,kitten.id,'weight').filter((event)=>Number(event.data.grams)>0);
    if(kitten.carePlan.dailyWeight&&(!weights[0]||!isSameLocalDay(weights[0].ts,now)))items.push({id:`weight-${kitten.id}`,kitten,type:'weight',text:'Daily weight needed',due:null});
    if(weights.length>1&&Number(weights[0].data.grams)<Number(weights[1].data.grams))items.push({id:`trend-${kitten.id}`,kitten,type:'weight',text:`Review weight: down ${Number(weights[1].data.grams)-Number(weights[0].data.grams)} g from previous entry`,due:null,review:true});
    const health=kittenEvents(state,kitten.id,'health')[0];
    if(health&&['Monitor','Concern'].includes(String(health.data.status)))items.push({id:`health-${kitten.id}`,kitten,type:'health',text:`Review latest health observation: ${health.data.status} (${new Date(health.ts).toLocaleString()})`,due:null,review:true});
    for(const medication of kitten.medications){
      const issue=medicationScheduleIssue(state,kitten,medication,now);
      if(issue){items.push({id:`med-${kitten.id}-${medication.id}`,kitten,type:'medication',medId:medication.id,text:`${medication.name}: ${issue}`,due:null,review:true});continue;}
      const due=nextMedicationDue(state,kitten,medication,now);
      if(due&&due.getTime()<=now.getTime()+3600000)items.push({id:`med-${kitten.id}-${medication.id}`,kitten,type:'medication',medId:medication.id,text:`${medication.name}: ${due<=now?'dose overdue':'due within one hour'}`,due});
    }
  }
  return items.sort((a,b)=>(a.due?.getTime()??Infinity)-(b.due?.getTime()??Infinity));
}
