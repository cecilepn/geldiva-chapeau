import {useEffect, useMemo, useState} from 'react';

const ASSET_KINDS = ['base', 'ribbon', 'loop'];

/**
 * @param {{
 *   assets: HatAsset[];
 *   fallbackImage?: {url?: string; altText?: string | null} | null;
 *   onChange?: (configuration: HatConfiguration) => void;
 *   renderDetails?: (configuration: HatConfiguration, options: React.ReactNode) => React.ReactNode;
 * }}
 */
export function HatConfigurator({
  assets,
  fallbackImage,
  onChange,
  renderDetails,
}) {
  const groupedAssets = useMemo(
    () => Object.groupBy(assets, (asset) => asset.kind),
    [assets],
  );

  const [selectedIds, setSelectedIds] = useState(() =>
    Object.fromEntries(
      ASSET_KINDS.map((kind) => [
        kind,
        kind === 'base' ? groupedAssets[kind]?.[0]?.id : undefined,
      ]),
    ),
  );
  const selectedAssets = useMemo(
    () =>
      Object.fromEntries(
        ASSET_KINDS.map((kind) => [
          kind,
          assets.find((asset) => asset.id === selectedIds[kind]) ?? null,
        ]),
      ),
    [assets, selectedIds],
  );

  const configuration = useMemo(
    () => ({
      ...selectedAssets,
      isComplete: Boolean(selectedAssets.base),
    }),
    [selectedAssets],
  );

  useEffect(() => {
    onChange?.(configuration);
  }, [configuration, onChange]);

  function selectAsset(kind, asset) {
    setSelectedIds((current) => ({...current, [kind]: asset.id}));
  }

  const baseImage = selectedAssets.base?.image ?? fallbackImage;
  const overlayAssets = [selectedAssets.ribbon, selectedAssets.loop].filter(
    Boolean,
  );

  const options = (
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
        onRemove={() =>
          setSelectedIds((current) => ({...current, ribbon: undefined}))
        }
      />
      <AssetOptions
        title="3. Passant"
        assets={groupedAssets.loop ?? []}
        selectedId={selectedIds.loop}
        onSelect={(asset) => selectAsset('loop', asset)}
        onRemove={() =>
          setSelectedIds((current) => ({...current, loop: undefined}))
        }
      />
    </div>
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

        {overlayAssets.map((asset) => (
          <img
            key={asset.id}
            className={`hat-configurator__layer hat-configurator__layer--${asset.kind}`}
            src={asset.image.url}
            alt=""
          />
        ))}
      </div>

      {renderDetails ? renderDetails(configuration, options) : options}
    </div>
  );
}

function AssetOptions({title, assets, selectedId, onSelect, onRemove}) {
  if (!assets.length) return null;
  return (
    <fieldset className="hat-configurator__group">
      <legend>{title}</legend>
      <div className="hat-configurator__choices">
        {onRemove && (
          <button
            type="button"
            className={
              selectedId
                ? 'hat-configurator__choice'
                : 'hat-configurator__choice is-selected'
            }
            aria-pressed={!selectedId}
            onClick={onRemove}
          >
            <span className="hat-configurator__none" aria-hidden="true">
              ×
            </span>
            <span>Aucun</span>
          </button>
        )}
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

/** @typedef {{id: string; handle: string; label: string; kind: string; code: string; swatch: string; image: {url: string; altText?: string | null} | null}} HatAsset */
/** @typedef {{base: HatAsset | null; ribbon: HatAsset | null; loop: HatAsset | null; isComplete: boolean}} HatConfiguration */
