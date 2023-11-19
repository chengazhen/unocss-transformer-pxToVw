// my-transformer.ts
import type { SourceCodeTransformer } from 'unocss'
import { createFilter } from '@rollup/pluginutils'
import { getUnitRegexp } from './utils'

interface OptionsType {
  viewportWidth: number
  minPixelValue: number
  unitPrecision: number
}

const vueRegxp = /\.vue$/
const cssRegexp = /\.(css|postcss|sass|scss|less|stylus|styl)($|\?)/
const unitRegexp = getUnitRegexp('px')

export default function myTransformers(options: OptionsType = { viewportWidth: 750, minPixelValue: 1, unitPrecision: 5 }): SourceCodeTransformer {
  const idFilter = createFilter(
    [vueRegxp, cssRegexp],
    [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/],
  )

  return {
    name: 'my-transformer',
    enforce: 'pre', // enforce before other transformers
    idFilter,
    async transform(code, id) {
      // vue 文件
      if (vueRegxp.test(id)) {
        const styleRegex = /<style([^>]*)>([\s\S]*?)<\/style>/g

        // 使用正则的 replace 方法进行替换，第二个参数可以是一个函数
        code.replace(styleRegex, (match, attributes, styleContent) => {
          // 在这里可以根据实际需求动态生成替换的内容
          const modifiedStyleContent = styleContent.replace(unitRegexp, createPxReplace(options, 'vw'))

          // 返回替换后的内容
          return `<style${attributes}>${modifiedStyleContent}</style>`
        })
      }
      // css 文件
      else {
        code.replace(unitRegexp, createPxReplace(options, 'vw'))
      }
    },
  }
}

function createPxReplace(opts: OptionsType, viewportUnit: string) {
  return function (m: string, $1: string) {
    if (!$1)
      return m
    const pixels = Number.parseFloat($1)
    if (pixels <= opts.minPixelValue)
      return m
    const parsedVal = toFixed((pixels / opts.viewportWidth * 100), opts.unitPrecision)
    return parsedVal === 0 ? '0' : parsedVal + viewportUnit
  }
}

function toFixed(number: number, precision: number) {
  const multiplier = 10 ** (precision + 1)
  const wholeNumber = Math.floor(number * multiplier)
  return Math.round(wholeNumber / 10) * 10 / multiplier
}
