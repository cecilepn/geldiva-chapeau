import {Link, useNavigate} from 'react-router';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 * }}
 */
export function ProductForm({
  productOptions,
  selectedVariant,
  customization,
  customizationOptions,
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const selectedAddons = [customization?.ribbon, customization?.loop].filter(
    Boolean,
  );
  const addonsAreAvailable = selectedAddons.every(
    (asset) => asset.variant?.availableForSale,
  );

  return (
    <div className="product-form">
      {productOptions.map((option) => {
        if (option.optionValues.length === 1) return null;

        return (
          <div className="product-options" key={option.name}>
            <h5>{option.name}</h5>
            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className="product-options-item"
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        border: selected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={`product-options-item${exists && !selected ? ' link' : ''}`}
                      key={option.name + name}
                      style={{
                        border: selected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
            <br />
          </div>
        );
      })}
      {customizationOptions}
      <AddToCartButton
        disabled={
          !selectedVariant ||
          !selectedVariant.availableForSale ||
          !customization?.isComplete ||
          !addonsAreAvailable
        }
        onClick={() => {
          open('cart');
        }}
        lines={
          selectedVariant && customization?.isComplete && addonsAreAvailable
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  selectedVariant,
                  attributes: [
                    {
                      key: 'Couleur principale',
                      value: customization.base.label,
                    },
                    ...(customization.ribbon
                      ? [
                          {
                            key: 'Gros grain',
                            value: customization.ribbon.label,
                          },
                        ]
                      : []),
                    ...(customization.loop
                      ? [
                          {
                            key: 'Passant',
                            value: customization.loop.label,
                          },
                        ]
                      : []),
                    {
                      key: '_Configuration',
                      value: JSON.stringify({
                        base: customization.base.handle,
                        ribbon: customization.ribbon?.handle ?? null,
                        loop: customization.loop?.handle ?? null,
                        ribbonVariantId:
                          customization.ribbon?.variant?.id ?? null,
                        loopVariantId: customization.loop?.variant?.id ?? null,
                      }),
                    },
                  ],
                },
                ...selectedAddons.map((asset) => ({
                  merchandiseId: asset.variant.id,
                  quantity: 1,
                  selectedVariant: asset.variant,
                  parent: {merchandiseId: selectedVariant.id},
                  attributes: [
                    {key: 'Personnalisation', value: asset.label},
                    {key: '_ConfigurationParent', value: selectedVariant.id},
                  ],
                })),
              ]
            : []
        }
      >
        {!selectedVariant?.availableForSale
          ? 'Indisponible'
          : !addonsAreAvailable
            ? 'Une option sélectionnée est indisponible'
            : customization?.isComplete
            ? 'Ajouter au panier'
            : 'Complétez la personnalisation'}
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name;

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
