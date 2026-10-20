import { useEffect } from 'react';
import { updateClientSEO, SEOMetadata } from '../lib/seo';

export default function SEOHead(props: SEOMetadata) {
  useEffect(() => {
    updateClientSEO(props);
  }, [
    props.title,
    props.description,
    props.canonicalUrl,
    props.imageUrl,
    props.type,
    props.noindex,
    props.publishedTime,
    props.modifiedTime,
    props.author,
    props.section,
    JSON.stringify(props.structuredData)
  ]);

  return null;
}
