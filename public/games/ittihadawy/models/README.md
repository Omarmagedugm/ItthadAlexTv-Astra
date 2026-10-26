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

## Lazo concept

`lazo-prototype.glb` is an original procedural interpretation of the supplied
character sheet: slim proportions, white/green jersey, green trousers, lime
backwards cap and blue/white glasses. Rebuild with
`python scripts/models/build_lazo.py` (NumPy, build time only).
It is an approximate concept, not a captured or sculpted exact likeness.

The common `lobby/character-prototype.js` adapter reads explicit joint and clothing
metadata from the Lazo GLB. Source vertex normals are preserved. Geometry is batched
by joint/material/clothing slot; requests are cached per asset URL. Custom headwear
and glasses replace the original accessories and attach to the new animated head.
Selecting defaults restores the original prototype accessories. All other character
models retain their own selection and outfit state.

Use `?lazoModel=classic` on the standalone game URL for the previous Lazo model.
Asset failures leave the previous model visible. No playable character is unlocked
by the model adapter. Lazo's existing ability, audio and motorcycle rules still apply.
The GLB itself contains static geometry and attachment metadata; the game supplies
rigid articulation. It does not contain a skinned skeleton or baked run clips.

Validated: GLB geometry/index ranges, draw-call batching, failed-download fallback,
all movement pivots, cap/glasses replacement and reset, and disposal during loading.
A CPU render was inspected. Mobile WebGL appearance still requires device testing.

## Hamido reference prototype

`hamido-prototype.glb` is generated with `python scripts/models/build_hamido.py` (NumPy). Original procedural geometry inspired by the supplied character sheet: white bucket hat and vest, green sleeves with white stripes, loose black trousers and blue darbuka. Approximate likeness, not a scan or skinned rig. The drum sits at the hip to leave existing running/ability motions unchanged; no new drumming animation is claimed. Existing engine pivots animate rigid body parts. Headwear and clothing support the existing store. Use `?hamidoModel=classic` on the standalone game URL to compare the original.

Validated geometry, loader fallback, articulation, wardrobe and build locally. Real mobile visual/performance validation remains necessary.

## Gamal El Dawly reference prototype

`gamal-prototype.glb` is generated with `python scripts/models/build_gamal.py` (NumPy). Reference-inspired mature face with grey beard, green turban and scarf, black waistcoat, green shirt, whistle and hand-held censer. The photograph does not show the lower legs; black trousers/shoes are a design assumption. Approximate procedural likeness with rigid articulation, not a scanned or skinned model. Existing voices, ability and physics stay unchanged. Wardrobe accessories use prototype anchors. Use `?gamalModel=classic` on the standalone game to compare.

Locally checked GLB geometry, fallback, movement-pivot synchronization, outfit changes and production build; actual mobile/WebGL visual validation is pending.

## Islam El Far prototype
`islam-prototype.glb` is rebuilt with `python scripts/models/build_islam.py` (NumPy). Reference-inspired quiff, short beard, blue sweatshirt, jeans, white shoes and watch. Approximate procedural likeness, rigid articulation through existing game pivots. Supports wardrobe and `?islamModel=classic`. Mobile visual testing remains pending.
