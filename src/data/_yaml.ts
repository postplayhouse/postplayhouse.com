import fs from "fs"
import path from "path"
import yaml from "js-yaml"

const dir = "src/data"

const YML_FILE = /\.yml$/

// Object.assign passes an index as well. We won't want that.
const simpleAssign = (acc, current) => ({ ...acc, ...current })

function dataFromDirectory(directoryPath) {
  const fullPath = (name) => `${directoryPath}/${name}`
  const dirname = path.basename(directoryPath)
  const data = fs
    .readdirSync(directoryPath)
    .filter((name) => {
      // allow folders that don't begin with an underscore
      if (fs.statSync(fullPath(name)).isDirectory() && name[0] !== "_") {
        return true
      }
      // allow yaml files
      return YML_FILE.test(name)
    })
    .map((name) => {
      if (fs.statSync(fullPath(name)).isDirectory()) {
        return dataFromDirectory(fullPath(name))
      } else {
        const basename = path.basename(name, ".yml")
        return {
          [basename]: yaml.load(fs.readFileSync(fullPath(name), "utf-8"), {
            schema: yaml.JSON_SCHEMA,
          }),
        }
      }
    })
    .reduce(simpleAssign, {})
  return { [dirname]: data }
}

export default dataFromDirectory(dir).data as YearlyData
