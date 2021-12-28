// Inspired by: https://github.com/isaaceindhoven/blog-docker-image-templating-basic

import { promises as fs } from "fs"
import fse from "fs-extra"
import nunjucks from "nunjucks"
import { default as rimrafCallback } from "rimraf"
import { promisify } from "util"
import { dirname } from "path"

const configFile = "config.json"
const templateFile = "src/Dockerfile_template.njk"
const outputDirectory = "build"

const rimraf = promisify(rimrafCallback)

/**
 * Returns all PHP and Node.js versions in the given config file
 */
async function getVersions(file) {
  const config = await fse.readJson(file)
//   const versions = []

//   for (const phpVersion of config.php) {
//     for (const nodeVersion of config.node) {
//       versions.push({
//         php: phpVersion,
//         node: nodeVersion,
//       })
//     }
//   }

//   return versions
    return config.versions
}

/**
 * Compiles a Nunjucks template given a filename
 *
 * @param file The filename of the template to compile
 * @return A Nunjuck template which can be rendered later
 */
async function compileTemplate(file) {
  const templateContents = await fs.readFile(file, "utf-8")
  return nunjucks.compile(templateContents)
}

/**
 * Promisified version of the nunjucks.render method to render a precompiled template
 * given a certain context.
 *
 * @param template The prepared template from the prepare method
 * @param context The context with which to render the template
 */
async function render(template, context) {
  return new Promise((resolve, reject) => {
    nunjucks.render(template, context, function (error, result) {
      if (error) {
        reject(error)
      }

      resolve(result)
    })
  })
}

/**
 * Writes a Dockerfile given a template and template context.
 *
 * @param template A compiled Nunjucks template
 * @param file The file path to write to
 * @param versions The version combination as context for the template, e.g. { php: "7.2", node: "10" }
 * @return An object containing all the versions as well as the file that was created
 */
async function createDockerfile(template, file, versions) {
  const dockerfile = await render(template, versions)
  const directory = dirname(file)
  await fs.mkdir(directory, { recursive: true })
  await fs.writeFile(file, dockerfile, "utf-8")

  return {
    ...versions,
    file,
  }
}

/**
 * Creates Dockerfiles using a template and a set of version combinations
 *
 * @param template A compiled Nunjucks template
 * @param versions The version combination as context for the template, e.g. { php: "7.2", node: "10" }
 */
async function createDockerfiles(template, versions) {
  return Promise.all(
    versions.map((version) =>
      createDockerfile(
        template,
        `${outputDirectory}/${version.php}/Dockerfile`,
        version
      )
    )
  )
}

/**
 * Copies files from the src/shared dir to each of the build dirs.
 *
 * @param versions The version combination as context for the template, e.g. { php: "7.2", node: "10" }
 */
async function copyBuildFiles(versions) {
  return Promise.all(
    versions.map((version) => {
      fse.copySync('src/shared', `${outputDirectory}/${version.php}`)
      fse.copySync(`src/${version.php}`, `${outputDirectory}/${version.php}`)
    })
  )
}

async function bootstrap() {
  // Delete the output folder before building
  await rimraf(outputDirectory)

  // Get the version combinations
  const versions = await getVersions(configFile)

  // Compile the Dockerfile template
  const template = await compileTemplate(templateFile)

  // Create the ouptut directory
  await fs.mkdir(outputDirectory)

  // Create the Dockerfiles and get the corresponding information
  const files = await createDockerfiles(template, versions)

  // Copies shared files into each build dir
  await copyBuildFiles(versions)

  // Write the infromation to an output.json file
  await fs.writeFile(
    `${outputDirectory}/output.json`,
    JSON.stringify(files, null, 2)
  )
}

bootstrap().then(() => console.log("Dockerfiles generated to the build directory."))