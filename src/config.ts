export interface Configuration {
  // Defaults to the current working directory.
  public?: string;
  cleanUrls?: boolean | string[];
  rewrites?: Array<Rewrite>;
  redirects?: Array<Redirect>;
  headers?: Array<Header>;
  trailingSlash?: boolean;
  i18n?: { root: string };
}

export interface Rewrite {
  source: string;
  destination: string;
}

export interface Redirect {
  source: string;
  destination: string;
  type?: number;
}

export interface Header {
  source: string;
  headers: {
    key: string;
    value: string;
  };
}
