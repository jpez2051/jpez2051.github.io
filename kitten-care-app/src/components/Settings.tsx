import { useRef,useState } from 'react';
import type { CareState,FosterSettings } from '../domain/models';
import { restoreBackup } from '../data/migrate';
import { Dialog } from './Dialog';

function downloadState(state:CareState,name:string){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const settingsEditToken=(settings:FosterSettings)=>JSON.stringify([settings.textSize||'standard',settings.mentorName||'',settings.mentorPhone||'',settings.rescueName||'',settings.rescuePhone||'',settings.emergencyInstructions||'']);
export function Settings({state,onClose,onHelp,onSave,onRestore,onBackup,onRecovery}:{state:CareState;onClose:()=>void;onHelp:()=>void;onSave:(settings:FosterSettings,expectedToken:string)=>Promise<boolean>;onRestore:(state:CareState)=>Promise<boolean>;onBackup:()=>Promise<boolean>;onRecovery:()=>Promise<CareState|null>}){
  const [message,setMessage]=useState(''),[saving,setSaving]=useState(false);
  const originalSettings=useRef(settingsEditToken(state.settings));
  return <Dialog title="Settings and help" onClose={onClose}>
    <button className="primary-wide" onClick={onHelp}>Open how-to guides</button>
    <p><a href="https://github.com/jpez2051/jpez2051.github.io/blob/main/kitten-care-app/CAREGIVER-TEST-GUIDE.md" target="_blank" rel="noreferrer">Caregiver testing checklist</a> · Use made-up records for testing.</p>
    {/not saved|changed in another|could not|were not/i.test(message)&&<p className="validation-summary" role="alert">{message}</p>}
    <form onSubmit={async event=>{
      event.preventDefault();if(saving)return;if(settingsEditToken(state.settings)!==originalSettings.current){setMessage('Settings changed in another tab. Copy your edits and reopen Settings before saving.');return}const data=new FormData(event.currentTarget);setSaving(true);
      try{if(!await onSave({textSize:String(data.get('textSize')) as 'standard'|'large',mentorName:String(data.get('mentorName')||''),mentorPhone:String(data.get('mentorPhone')||''),rescueName:String(data.get('rescueName')||''),rescuePhone:String(data.get('rescuePhone')||''),emergencyInstructions:String(data.get('emergencyInstructions')||'')},originalSettings.current))setMessage('Settings were not saved. Keep this form open and try again.')}finally{setSaving(false)}
    }}><h3>Display</h3><label>Text size<select name="textSize" defaultValue={state.settings.textSize||'standard'}><option value="standard">Standard</option><option value="large">Larger text</option></select></label>
      <h3>Urgent contacts</h3><label>Mentor name<input name="mentorName" defaultValue={state.settings.mentorName}/></label><label>Mentor phone<input name="mentorPhone" type="tel" defaultValue={state.settings.mentorPhone}/></label><label>Rescue or veterinary contact<input name="rescueName" defaultValue={state.settings.rescueName}/></label><label>Rescue or veterinary phone<input name="rescuePhone" type="tel" defaultValue={state.settings.rescuePhone}/></label><label>Rescue-approved urgent instructions<textarea name="emergencyInstructions" defaultValue={state.settings.emergencyInstructions}/></label>
      <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button disabled={saving}>Save settings</button></div>
    </form>
    <section className="subsection"><h3>Backup and restore</h3><p>Records stay in this browser. Updates coordinate between current-version tabs; close older-version tabs. A previous saved copy is kept locally, but clearing browser data can remove both copies.</p><p>Backups contain private care information. Store them privately and verify the downloaded file.</p>
      <p>Last backup requested: {state.settings.lastBackupAt?new Date(state.settings.lastBackupAt).toLocaleString():'Not recorded'}</p>
      <div className="backup-actions"><button onClick={async()=>{downloadState(state,`a4a-kitten-care-backup-${new Date().toLocaleDateString('en-CA')}.json`);setMessage(await onBackup()?'Backup download requested. Verify the file is saved.':'Backup requested, but its timestamp was not saved. Verify the file.')}}>Download backup</button>
        <button onClick={async()=>{try{const previous=await onRecovery();if(!previous){setMessage('No previous saved copy is available yet.');return}downloadState(previous,'a4a-kitten-care-recovery.json');setMessage('Previous saved copy requested. Review it before restoring.')}catch{setMessage('The previous copy could not be read. Your current records were not changed.')}}}>Download previous saved copy</button>
        <label className="file-button">Restore backup<input type="file" accept="application/json,.json" onChange={event=>{
          const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();
          reader.onload=async()=>{try{const restored=restoreBackup(JSON.parse(String(reader.result)));if(window.confirm(`Replace current care records with ${restored.kittens.length} kittens and ${restored.events.length} care entries from this backup? Download your current backup first.`)){if(!await onRestore(restored))setMessage('Restore was not saved. Current records were not replaced.')}}catch{window.alert('That file is not a valid kitten care backup.')}};
          reader.onerror=()=>setMessage('The backup file could not be read.');reader.readAsText(file);
        }}/></label>
      </div><p role="status">{message}</p>
    </section>
  </Dialog>;
}
