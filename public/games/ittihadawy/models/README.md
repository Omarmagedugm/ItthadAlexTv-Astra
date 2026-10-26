# Adel prototype experiment

`adel-prototype.glb` is a procedural concept model (~1 MB), created for this project.
It is not a photogrammetric reconstruction or an exact match to the approved art.

The `lobby/adel-prototype.js` adapter reads only this uncompressed GLB subset,
batches meshes by articulation/material, and follows the existing character pivots.
The original gameplay physics, collision bounds, scoring and sounds are unchanged.
This is rigid articulation, not skeletal skinning; shoulders and knees need visual
review and refinement. It is not a production-quality character rig.

Select Adel normally to test. Append `?adelModel=classic` to the standalone game URL
to compare with the original model. Download/parse errors keep the original visible.
No account authorization or character unlock rules are bypassed by this experiment.

The HUD follows the supplied reference's blue current-region sign, dark score chips,
circular translucent controls and green ability button. No Fabrika label is added.
The existing 3D zones remain; the detailed architecture in the concept artwork has
not been recreated as new 3D assets. Fullscreen canvas and camera are preserved.

Validation: GLB data, actual bundled Three.js geometry/pivots, character isolation,
disposal during loading, integration checks and production build. Real-device
WebGL, appearance, accessory fitting and performance still require testing.
