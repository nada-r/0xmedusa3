"use client"

import { Region } from "@medusajs/medusa"
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"
import { Button } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"
import { addToCart } from "@modules/cart/actions"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/option-select"

import MobileActions from "../mobile-actions"
import ProductPrice from "../product-price"
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit'

type ProductActionsProps = {
  product: PricedProduct
  region: Region
}

export type PriceType = {
  calculated_price: string
  original_price?: string
  price_type?: "sale" | "default"
  percentage_diff?: string
}

export default function ProductActions({
  product,
  region,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [isHuman, setIsHuman] = useState(false)

  const countryCode = useParams().countryCode as string

  const variants = product.variants

  // initialize the option state
  useEffect(() => {
    const optionObj: Record<string, string> = {}

    for (const option of product.options || []) {
      Object.assign(optionObj, { [option.id]: undefined })
    }

    setOptions(optionObj)
  }, [product])

  // memoized record of the product's variants
  const variantRecord = useMemo(() => {
    const map: Record<string, Record<string, string>> = {}

    for (const variant of variants) {
      if (!variant.options || !variant.id) continue

      const temp: Record<string, string> = {}

      for (const option of variant.options) {
        temp[option.option_id] = option.value
      }

      map[variant.id] = temp
    }

    return map
  }, [variants])

  // memoized function to check if the current options are a valid variant
  const variant = useMemo(() => {
    let variantId: string | undefined = undefined

    for (const key of Object.keys(variantRecord)) {
      if (isEqual(variantRecord[key], options)) {
        variantId = key
      }
    }

    return variants.find((v) => v.id === variantId)
  }, [options, variantRecord, variants])

  // if product only has one variant, then select it
  useEffect(() => {
    if (variants.length === 1 && variants[0].id) {
      setOptions(variantRecord[variants[0].id])
    }
  }, [variants, variantRecord])

  // update the options when a variant is selected
  const updateOptions = (update: Record<string, string>) => {
    setOptions({ ...options, ...update })
  }

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    if (variant && !variant.inventory_quantity) {
      return false
    }

    if (variant && variant.allow_backorder === false) {
      return true
    }
  }, [variant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!variant?.id || !isHuman) return null // Check if human

    setIsAdding(true)

    await addToCart({
      variantId: variant.id,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  // handle human confirmation
  const handleHumanConfirmation = () => {
    setIsHuman(true)
  }

  // TODO: Calls your implemented server route
const verifyProof = async (proof) => {
  throw new Error("TODO: verify proof server route")
};

// TODO: Functionality after verifying
const onSuccess = () => {
  console.log("Success")
};

  return (
    <>
    <IDKitWidget
    app_id="app_c7e5d4b63c67526e8d1b437b245aae86"
    action="proof-of-humanity"
    false
    verification_level={VerificationLevel.Device}
    handleVerify={verifyProof}
    onSuccess={onSuccess}>
    {({ open }) => (
      <button
        onClick={open}
      >
        Verify with World ID
      </button>
    )}
</IDKitWidget>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {product.variants.length > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={updateOptions}
                      title={option.title}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={variant} region={region} />

        <Button
          onClick={handleHumanConfirmation}
          variant="primary"
          className="w-full h-10"
        >
          I am a unique human
        </Button>

        <Button
          onClick={handleAddToCart}
          disabled={!inStock || !variant || !isHuman} // Check if human
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
        >
          {!variant
            ? "Select variant"
            : !inStock
            ? "Out of stock"
            : "Add to cart"}
        </Button>
        <MobileActions
          product={product}
          variant={variant}
          region={region}
          options={options}
          updateOptions={updateOptions}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
        />
      </div>
    </>
  )
}
