import {findClusterBreak, countColumn, findColumn} from "@codemirror/text"
import ist from "ist"

describe("findClusterBreak", () => {
  function test(spec: string) {
    it(spec, () => {
      let breaks = [], next: number
      while ((next = spec.indexOf("|")) > -1) {
        breaks.push(next)
        spec = spec.slice(0, next) + spec.slice(next + 1)
      }
      let found = []
      for (let i = 0;;) {
        let next = findClusterBreak(spec, i)
        if (next == spec.length) break
        found.push(i = next)
      }
      ist(found.join(","), breaks.join(","))
    })
  }
  
  test("a|b|c|d")
  test("a|eฬฬ |oฬ|x")
  test("๐|๐")
  test("๐จโ๐ค|๐ช๐ฝ|๐ฉโ๐ฉโ๐งโ๐ฆ|โค")
  test("๐ฉ๐ช|๐ซ๐ท|๐ช๐ธ|x|๐ฎ๐น")
})

describe("countColumn", () => {
  it("counts characters", () => ist(countColumn("abc", 4), 3))

  it("counts tabs correctly", () => ist(countColumn("a\t\tbc\tx", 4), 13))

  it("handles clusters", () => ist(countColumn("a๐๐ซ๐ท", 4), 3))
})

describe("findColumn", () => {
  it("finds positions", () => ist(findColumn("abc", 3, 4), 3))

  it("counts tabs", () => ist(findColumn("a\tbc", 4, 4), 2))

  it("handles clusters", () => ist(findColumn("a๐๐ซ๐ทbc", 4, 4), 8))
})
