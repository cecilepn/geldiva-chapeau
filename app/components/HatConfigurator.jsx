import {useEffect, useMemo, useRef, useState} from 'react';

const REQUIRED_KINDS = ['base', 'ribbon', 'loop'];

/**
 * @param {{
 *   assets: HatAsset[];
 *   fallbackImage?: {url?: string; altText?: string | null} | null;
 *   onChange: (configuration: HatConfiguration) => void;
 * }}
 */
export function HatConfigurator({assets, fallbackImage, onChange}) {
  const groupedAssets = useMemo(
    () => Object.groupBy(assets, (asset) => asset.kind),
    [assets],
  );

  const [selectedIds, setSelectedIds] = useState(() =>
    Object.fromEntries(
      REQUIRED_KINDS.map((kind) => [kind, groupedAssets[kind]?.[0]?.id]),
    ),
  );
  const [placements, setPlacements] = useState(() =>
    Object.fromEntries(assets.map((asset) => [asset.id, asset.placement])),
  );

  const selectedAssets = useMemo(
    () =>
      Object.fromEntries(
        REQUIRED_KINDS.map((kind) => [
          kind,
          assets.find((asset) => asset.id === selectedIds[kind]) ?? null,
        ]),
      ),
    [assets, selectedIds],
  );

  useEffect(() => {
    onChange({
      ...selectedAssets,
      placements,
      isComplete: REQUIRED_KINDS.every((kind) => selectedAssets[kind]),
    });
  }, [onChange, placements, selectedAssets]);

  function selectAsset(kind, asset) {
    setSelectedIds((current) => ({...current, [kind]: asset.id}));
    setPlacements((current) => ({
      ...current,
      [asset.id]: current[asset.id] ?? asset.placement,
    }));
  }

  function updatePlacement(assetId, nextPlacement) {
    setPlacements((current) => ({...current, [assetId]: nextPlacement}));
  }

  const baseImage = selectedAssets.base?.image ?? fallbackImage;
  const adjustableAssets = [selectedAssets.ribbon, selectedAssets.loop].filter(
    Boolean,
  );

  return (
    <div className="hat-configurator">
      <div className="hat-configurator__canvas" aria-label="Aperçu du chapeau">
        {baseImage?.url ? (
          <img
            className="hat-configurator__base"
            src={baseImage.url}
            alt={baseImage.altText || 'Aperçu du chapeau personnalisé'}
          />
        ) : (
          <p className="hat-configurator__empty">Ajoutez une image de base.</p>
        )}

        {adjustableAssets.map((asset) => (
          <DraggableLayer
            key={asset.id}
            asset={asset}
            placement={placements[asset.id] ?? asset.placement}
            onChange={(placement) => updatePlacement(asset.id, placement)}
          />
        ))}
      </div>

      <div className="hat-configurator__options">
        <AssetOptions
          title="1. Couleur principale"
          assets={groupedAssets.base ?? []}
          selectedId={selectedIds.base}
          onSelect={(asset) => selectAsset('base', asset)}
        />
        <AssetOptions
          title="2. Gros grain"
          assets={groupedAssets.ribbon ?? []}
          selectedId={selectedIds.ribbon}
          onSelect={(asset) => selectAsset('ribbon', asset)}
        />
        <AssetOptions
          title="3. Passant"
          assets={groupedAssets.loop ?? []}
          selectedId={selectedIds.loop}
          onSelect={(asset) => selectAsset('loop', asset)}
        />

        {adjustableAssets.map((asset) => {
          const placement = placements[asset.id] ?? asset.placement;
          return (
            <fieldset className="hat-configurator__adjustments" key={asset.id}>
              <legend>Ajuster : {asset.label}</legend>
              <label>
                Taille
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={placement.width}
                  onChange={(event) =>
                    updatePlacement(asset.id, {
                      ...placement,
                      width: Number(event.currentTarget.value),
                    })
                  }
                />
              </label>
              <label>
                Rotation
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={placement.rotation}
                  onChange={(event) =>
                    updatePlacement(asset.id, {
                      ...placement,
                      rotation: Number(event.currentTarget.value),
                    })
                  }
                />
              </label>
              <button
                type="button"
                onClick={() => updatePlacement(asset.id, asset.placement)}
              >
                Réinitialiser la position
              </button>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

function AssetOptions({title, assets, selectedId, onSelect}) {
  if (!assets.length) return null;
  return (
    <fieldset className="hat-configurator__group">
      <legend>{title}</legend>
      <div className="hat-configurator__choices">
        {assets.map((asset) => (
          <button
            type="button"
            key={asset.id}
            className={
              asset.id === selectedId
                ? 'hat-configurator__choice is-selected'
                : 'hat-configurator__choice'
            }
            aria-pressed={asset.id === selectedId}
            onClick={() => onSelect(asset)}
            title={asset.label}
          >
            <span
              className="hat-configurator__swatch"
              style={{backgroundColor: asset.swatch || '#e5e5e5'}}
            />
            <span>{asset.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function DraggableLayer({asset, placement, onChange}) {
  const drag = useRef(null);

  function handlePointerDown(event) {
    const canvas = event.currentTarget.parentElement;
    const bounds = canvas.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: placement.x,
      startY: placement.y,
      bounds,
    };
  }

  function handlePointerMove(event) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const {bounds, startClientX, startClientY, startX, startY} = drag.current;
    const x = startX + ((event.clientX - startClientX) / bounds.width) * 100;
    const y = startY + ((event.clientY - startClientY) / bounds.height) * 100;
    onChange({
      ...placement,
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  function handlePointerUp(event) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  if (!asset.image?.url) return null;

  return (
    <img
      className="hat-configurator__layer"
      src={asset.image.url}
      alt=""
      draggable="false"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        zIndex: placement.zIndex,
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
      }}
    />
  );
}

/** @typedef {{x: number; y: number; width: number; rotation: number; zIndex: number}} Placement */
/** @typedef {{id: string; handle: string; label: string; kind: string; code: string; swatch: string; image: {url: string; altText?: string | null} | null; placement: Placement}} HatAsset */
/** @typedef {{base: HatAsset | null; ribbon: HatAsset | null; loop: HatAsset | null; placements: Record<string, Placement>; isComplete: boolean}} HatConfiguration */
