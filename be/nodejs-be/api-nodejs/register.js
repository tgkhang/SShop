import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register('./src/loader.js', pathToFileURL('./'))
