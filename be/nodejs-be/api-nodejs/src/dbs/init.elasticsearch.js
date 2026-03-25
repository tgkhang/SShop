import { Client } from '@elastic/elasticsearch'
import { env } from '#configs/environment.js'

let esClient = null

const initElasticsearch = async ({ isEnabled = true } = {}) => {
  if (!isEnabled) return

  esClient = new Client({
    node: env.ELASTICSEARCH_HOST || 'http://localhost:9200',
  })

  try {
    const info = await esClient.info()
    console.log(`Elasticsearch connected :: cluster [${info.cluster_name}] version [${info.version.number}]`)
  } catch (err) {
    console.error('Elasticsearch connection failed:', err.message)
    esClient = null
  }
}

const getElasticsearch = () => esClient

const closeElasticsearch = async () => {
  if (esClient) {
    await esClient.close()
    esClient = null
  }
}

export const ElasticDB = {
  initElasticsearch,
  getElasticsearch,
  closeElasticsearch,
}
