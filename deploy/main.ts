import type { Construct } from "constructs";
import { App, Chart, YamlOutputType } from "cdk8s";
import * as k8s from "./imports/k8s";

interface AtlasAppProps {
  name: string;
  host: string;
  image: string;
  replicas: number;
  port: number;
}

export class AtlasApp extends Chart {
  constructor(scope: Construct, id: string, props: AtlasAppProps) {
    super(scope, id, {
      disableResourceNameHashes: true,
    });

    const labels = {
      app: props.name,
    };

    new k8s.KubeDeployment(this, "deployment", {
      metadata: {
        name: props.name,
      },
      spec: {
        replicas: props.replicas,
        selector: {
          matchLabels: labels,
        },
        template: {
          metadata: {
            labels: labels,
          },
          spec: {
            containers: [
              {
                name: "app",
                image: props.image,
                ports: [{ containerPort: props.port }],
              },
            ],
          },
        },
      },
    });

    const service = new k8s.KubeService(this, "service", {
      metadata: {
        name: props.name,
      },
      spec: {
        type: "ClusterIP",
        selector: labels,
        ports: [{ port: props.port }],
      },
    });

    new k8s.KubeIngress(this, "ingress", {
      metadata: {
        name: props.name,
      },
      spec: {
        rules: [
          {
            host: props.host,
            http: {
              paths: [
                {
                  pathType: "Prefix",
                  path: "/",
                  backend: {
                    service: {
                      name: service.name,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    });
  }
}

if (!("IMAGE_TAG" in process.env)) {
  console.warn("IMAGE_TAG env var is not defined, using fixme:latest");
  process.exit(1)
}
const imageTag: string = process.env.IMAGE_TAG || "fixme:latest";

const app = new App({
  yamlOutputType: YamlOutputType.FOLDER_PER_CHART_FILE_PER_RESOURCE,
});

new AtlasApp(app, "dev", {
  name: "my-app",
  host: "foo.dev.example.com",
  replicas: 1,
  port: 8000,
  image: imageTag,
});

new AtlasApp(app, "prod", {
  name: "my-app",
  host: "foo.prod.example.com",
  replicas: 3,
  port: 8000,
  image: imageTag,
});

app.synth();
