import type { MedicationSafety } from '../domain/models';

export function MedicationSafetyFields({value}:{value?:MedicationSafety}){
  return <details className="safety-settings"><summary>Product, measuring device and safety limits</summary>
    <p>Enter the rescue’s actual instructions. Blank limits stay unconfigured; the app does not invent clinical cutoffs or syringe precision. Automation remains available for testing.</p>
    <label>Exact bottle or product label<input name="productLabel" defaultValue={value?.productLabel}/></label>
    <label>Preparation / concentration as supplied<input name="preparation" defaultValue={value?.preparation} placeholder="Copy the label; do not guess a strength"/></label>
    <label>Approving rescue or veterinary contact<input name="approvedBy" defaultValue={value?.approvedBy}/></label>
    <label>Measuring device name<input name="deviceName" defaultValue={value?.deviceName} placeholder="Device supplied for this medication"/></label>
    <div className="two"><label>Smallest reliable amount (mL)<input name="minimumMeasurableMl" type="number" min="0.000001" step="any" defaultValue={value?.minimumMeasurableMl}/></label>
    <label>Device graduation size (mL)<input name="incrementMl" type="number" min="0.000001" step="any" defaultValue={value?.incrementMl}/></label></div>
    <label>Minimum hours between doses, if instructed<input name="minimumSpacingHours" type="number" min="0.001" step="any" defaultValue={value?.minimumSpacingHours}/></label>
    <p>Weight limits are for this kitten at its current age. Review them as the kitten grows.</p>
    <div className="two"><label>Expected minimum weight (g)<input name="minimumWeightG" type="number" min="1" step="any" defaultValue={value?.minimumWeightG}/></label>
    <label>Expected maximum weight (g)<input name="maximumWeightG" type="number" min="1" step="any" defaultValue={value?.maximumWeightG}/></label></div>
    <label>Weight-change recheck threshold (%)<input name="maximumWeightChangePercent" type="number" min="0.001" step="any" defaultValue={value?.maximumWeightChangePercent}/></label>
  </details>;
}
