# RabbitMQ DLX - Mermaid Diagrams

This document contains visual diagrams for the RabbitMQ Dead Letter Exchange (DLX) implementation.

## Complete Message Flow with DLX

```mermaid
graph TB
    subgraph Producer["Producer (producerDLX.js)"]
        P[Send Message<br/>TTL: 5s<br/>expiration: '5000']
    end

    subgraph NormalFlow["Normal Processing Flow"]
        NE[notification_exchange<br/>Type: Direct<br/>Routing: notification_routing_key]
        NQ[notification_queue_processing<br/>DLX: notification_exchange_dlx<br/>DLX Routing: notification_routing_key_dlx]
        NC[consumerToQueueNormal<br/>Action: Log & ACK]
    end

    subgraph DLXFlow["Dead Letter Flow"]
        DLX[notification_exchange_dlx<br/>Type: Direct<br/>Routing: notification_routing_key_dlx]
        DLQ[notification_queue_hot_fix<br/>DLX Queue]
        DLC[consumerToQueueFail<br/>Action: Log & Auto-ACK]
    end

    subgraph Triggers["DLX Triggers"]
        T1[Message Expired<br/>TTL > 5s]
        T2[Consumer Rejected<br/>nack with requeue=false]
        T3[Queue Full<br/>max-length exceeded]
    end

    P -->|Publish| NE
    NE -->|Route by Key| NQ
    NQ -->|Success<br/>Consumed < 5s| NC
    NC -->|Message Processed| SUCCESS[✓ Success]

    NQ -.->|Failure| T1
    NQ -.->|Failure| T2
    NQ -.->|Failure| T3

    T1 -->|Auto Route| DLX
    T2 -->|Auto Route| DLX
    T3 -->|Auto Route| DLX

    DLX -->|Route by DLX Key| DLQ
    DLQ -->|Consume| DLC
    DLC -->|Manual Fix/Retry| MANUAL[⚠ Manual Intervention]

    style P fill:#e1f5ff
    style NE fill:#fff4e1
    style NQ fill:#fff4e1
    style NC fill:#e1ffe1
    style DLX fill:#ffe1e1
    style DLQ fill:#ffe1e1
    style DLC fill:#ffe1e1
    style SUCCESS fill:#90EE90
    style MANUAL fill:#FFB6C1
    style T1 fill:#FFE4B5
    style T2 fill:#FFE4B5
    style T3 fill:#FFE4B5
```

---

## Sequence Diagram - Normal Flow (Success)

```mermaid
sequenceDiagram
    participant P as Producer
    participant NE as notification_exchange
    participant NQ as notification_queue_processing
    participant C as consumerToQueueNormal

    P->>NE: Publish Message (TTL: 5s)<br/>routing_key: notification_routing_key
    NE->>NQ: Route to Queue
    Note over NQ: Message waiting<br/>TTL countdown starts
    C->>NQ: Consume Message (< 5s)
    NQ->>C: Deliver Message
    C->>C: Process Message<br/>Log Success
    C->>NQ: ACK (Acknowledge)
    Note over NQ: Message Removed ✓
```

---

## Sequence Diagram - DLX Flow (Message Expired)

```mermaid
sequenceDiagram
    participant P as Producer
    participant NE as notification_exchange
    participant NQ as notification_queue_processing
    participant DLX as notification_exchange_dlx
    participant DLQ as notification_queue_hot_fix
    participant DC as consumerToQueueFail

    P->>NE: Publish Message (TTL: 5s)
    NE->>NQ: Route to Queue
    Note over NQ: TTL Countdown: 5s...4s...3s...2s...1s...0s
    Note over NQ: ⚠ Message Expired!
    NQ->>DLX: Auto-route with<br/>routing_key: notification_routing_key_dlx
    DLX->>DLQ: Route to DLX Queue
    DC->>DLQ: Consume Failed Message
    DLQ->>DC: Deliver Message
    DC->>DC: Log: "Need to fix issue"
    Note over DC: Auto-ACK (noAck: true)<br/>Message Removed
    Note over DC: ⚠ Manual intervention needed
```

---

## Sequence Diagram - DLX Flow (Consumer Rejection)

```mermaid
sequenceDiagram
    participant P as Producer
    participant NE as notification_exchange
    participant NQ as notification_queue_processing
    participant C as Consumer
    participant DLX as notification_exchange_dlx
    participant DLQ as notification_queue_hot_fix
    participant DC as consumerToQueueFail

    P->>NE: Publish Message (TTL: 5s)
    NE->>NQ: Route to Queue
    C->>NQ: Consume Message
    NQ->>C: Deliver Message
    C->>C: Processing Failed ✗
    C->>NQ: NACK (requeue: false)
    Note over NQ: Message Rejected
    NQ->>DLX: Auto-route to DLX<br/>routing_key: notification_routing_key_dlx
    DLX->>DLQ: Route to DLX Queue
    DC->>DLQ: Consume Failed Message
    DLQ->>DC: Deliver Message
    DC->>DC: Log & Handle Failure
```

---

## Component Relationship Diagram

```mermaid
graph LR
    subgraph Configuration
        C1[Exchange: notification_exchange<br/>Type: Direct<br/>Durable: true]
        C2[Queue: notification_queue_processing<br/>DLX: notification_exchange_dlx<br/>DLX Routing: notification_routing_key_dlx]
        C3[Exchange: notification_exchange_dlx<br/>Type: Direct<br/>Durable: true]
        C4[Queue: notification_queue_hot_fix<br/>Exclusive: false]
    end

    C1 -->|Binding<br/>notification_routing_key| C2
    C3 -->|Binding<br/>notification_routing_key_dlx| C4
    C2 -.->|DLX Reference| C3

    style C1 fill:#fff4e1
    style C2 fill:#fff4e1
    style C3 fill:#ffe1e1
    style C4 fill:#ffe1e1
```

---

## State Diagram - Message Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Published: Producer sends message
    Published --> InQueue: Routed to notification_queue_processing
    InQueue --> Processing: Consumer picks up message
    InQueue --> Expired: TTL > 5s (no consumer)
    Processing --> Acknowledged: Successfully processed
    Processing --> Rejected: Processing failed
    Processing --> Expired: Processing takes > 5s

    Acknowledged --> [*]: Message removed ✓

    Expired --> DLXRouted: Auto-route to DLX
    Rejected --> DLXRouted: Auto-route to DLX

    DLXRouted --> InDLXQueue: In notification_queue_hot_fix
    InDLXQueue --> ManualHandling: consumerToQueueFail processes
    ManualHandling --> [*]: Logged for manual fix

    note right of InQueue
        TTL countdown: 5000ms
        Waiting for consumer
    end note

    note right of DLXRouted
        Routing Key: notification_routing_key_dlx
        Exchange: notification_exchange_dlx
    end note
```

---

## TTL Timeline Diagram

```mermaid
gantt
    title Message TTL Lifecycle (5 seconds)
    dateFormat X
    axisFormat %Ls

    section Normal Flow
    Message Published           :milestone, m1, 0, 0
    Message in Queue (TTL 5s)   :active, task1, 0, 5000
    Consumer Processes (< 5s)   :crit, task2, 2000, 500
    Message ACK & Removed       :milestone, m2, 2500, 0

    section DLX Flow
    Message Published           :milestone, m3, 6000, 0
    Message in Queue (TTL 5s)   :active, task3, 6000, 5000
    No Consumer (Idle)          :task4, 6000, 5000
    TTL Expired at 5s           :milestone, m4, 11000, 0
    Auto-route to DLX           :crit, task5, 11000, 200
    Message in DLX Queue        :task6, 11200, 2000
    DLX Consumer Processes      :crit, task7, 11200, 500
```

---

## Architecture Overview - C4 Style

```mermaid
graph TB
    subgraph RabbitMQ["RabbitMQ Message Broker"]
        subgraph NormalPath["Normal Message Path"]
            E1[notification_exchange<br/>────────────<br/>Type: Direct<br/>Durable: true<br/>Routing: notification_routing_key]
            Q1[notification_queue_processing<br/>────────────<br/>exclusive: false<br/>deadLetterExchange: notification_exchange_dlx<br/>deadLetterRoutingKey: notification_routing_key_dlx<br/>Message TTL: 5000ms]
        end

        subgraph DLXPath["Dead Letter Path"]
            E2[notification_exchange_dlx<br/>────────────<br/>Type: Direct<br/>Durable: true<br/>Routing: notification_routing_key_dlx]
            Q2[notification_queue_hot_fix<br/>────────────<br/>exclusive: false<br/>No TTL]
        end
    end

    subgraph Services["Microservices"]
        PROD[Producer Service<br/>────────────<br/>producerDLX.js<br/>Sends messages with TTL]
        CONS1[Consumer Service<br/>────────────<br/>consumerToQueueNormal<br/>Processes normal messages]
        CONS2[DLX Consumer Service<br/>────────────<br/>consumerToQueueFail<br/>Handles failed messages]
    end

    PROD -->|1. Publish Message<br/>TTL: 5s| E1
    E1 -->|2. Route| Q1
    Q1 -->|3. Deliver| CONS1
    CONS1 -->|4. ACK| Q1

    Q1 -.->|5. On Failure/Expiry| E2
    E2 -.->|6. Route to DLX| Q2
    Q2 -.->|7. Deliver Failed Msg| CONS2

    style E1 fill:#FFE4B5,stroke:#FF8C00,stroke-width:2px
    style Q1 fill:#FFF8DC,stroke:#FF8C00,stroke-width:2px
    style E2 fill:#FFB6C1,stroke:#DC143C,stroke-width:2px
    style Q2 fill:#FFE4E1,stroke:#DC143C,stroke-width:2px
    style PROD fill:#E0F2F7,stroke:#0277BD,stroke-width:2px
    style CONS1 fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
    style CONS2 fill:#FFF3E0,stroke:#E65100,stroke-width:2px
```

---

## Detailed Routing Flow

```mermaid
flowchart TD
    Start([Producer Starts]) --> CreateConn[Connect to RabbitMQ<br/>amqp://localhost]
    CreateConn --> CreateChannel[Create Channel]
    CreateChannel --> AssertExchange[Assert Exchange<br/>notification_exchange<br/>Type: Direct, Durable: true]
    AssertExchange --> AssertQueue[Assert Queue<br/>notification_queue_processing<br/>with DLX config]
    AssertQueue --> BindQueue[Bind Queue to Exchange<br/>Routing Key: notification_routing_key]
    BindQueue --> SendMsg[Send Message<br/>expiration: 5000ms]
    SendMsg --> MsgInQueue{Message in Queue}

    MsgInQueue -->|Path A: Success| ConsumerReady{Consumer Available?}
    ConsumerReady -->|Yes & t < 5s| Consume[consumerToQueueNormal<br/>Consumes Message]
    Consume --> Process[Process Message<br/>Log Success]
    Process --> ACK[channel.ack]
    ACK --> Done1([✓ Message Removed])

    ConsumerReady -->|No| WaitTTL[Wait for Consumer]
    WaitTTL --> CheckTTL{TTL Expired?}
    CheckTTL -->|No, t < 5s| WaitTTL
    CheckTTL -->|Yes, t >= 5s| Expired

    MsgInQueue -->|Path B: Failure| ConsumerFail{Consumer Rejects?}
    ConsumerFail -->|NACK requeue=false| Rejected[Message Rejected]
    Rejected --> Expired

    Expired[Message Expired/Rejected] --> AutoRoute[RabbitMQ Auto-Routes<br/>to DLX]
    AutoRoute --> DLXExchange[notification_exchange_dlx<br/>Direct Exchange]
    DLXExchange --> DLXQueue[notification_queue_hot_fix<br/>DLX Queue]
    DLXQueue --> DLXConsumer[consumerToQueueFail<br/>Consumes Failed Message]
    DLXConsumer --> DLXProcess[Log: Need to fix issue]
    DLXProcess --> AutoACK[Auto-ACK<br/>noAck: true]
    AutoACK --> ManualFix([⚠ Manual Intervention])

    style Start fill:#E3F2FD
    style Done1 fill:#C8E6C9
    style ManualFix fill:#FFCCBC
    style Expired fill:#FFEBEE
    style ACK fill:#C8E6C9
    style AutoACK fill:#FFF9C4
    style SendMsg fill:#E1F5FE
    style Consume fill:#F1F8E9
    style DLXConsumer fill:#FFF3E0
```

---

## Error Handling Flow

```mermaid
flowchart TD
    MSG[Message Arrives] --> EVAL{Evaluate Message}

    EVAL -->|Valid & Processed| SUCCESS[✓ Success Path]
    SUCCESS --> ACK[channel.ack]
    ACK --> REMOVE[Message Removed from Queue]
    REMOVE --> END1([End - Success])

    EVAL -->|Processing Error| ERROR[Error During Processing]
    ERROR --> DECISION{Error Type?}

    DECISION -->|Transient Error<br/>Can Retry| NACK_REQUEUE[channel.nack<br/>requeue: true]
    NACK_REQUEUE --> REQUEUE[Message Back to Queue]
    REQUEUE --> RETRY{Retry Count?}
    RETRY -->|< Max Retries| MSG
    RETRY -->|>= Max Retries| NACK_DLX[channel.nack<br/>requeue: false]

    DECISION -->|Permanent Error<br/>Bad Data| NACK_DLX

    EVAL -->|No Consumer| WAIT[Wait in Queue]
    WAIT --> TIMEOUT{TTL Timeout?}
    TIMEOUT -->|< 5s| WAIT
    TIMEOUT -->|>= 5s| EXPIRE[Message Expired]

    NACK_DLX --> DLX_ROUTE[Route to DLX]
    EXPIRE --> DLX_ROUTE

    DLX_ROUTE --> DLX_EXCHANGE[notification_exchange_dlx]
    DLX_EXCHANGE --> DLX_QUEUE[notification_queue_hot_fix]
    DLX_QUEUE --> DLX_CONSUMER[consumerToQueueFail]
    DLX_CONSUMER --> LOG[Log Failed Message]
    LOG --> MANUAL_CHECK{Manual Review}

    MANUAL_CHECK -->|Fix & Republish| REPUBLISH[Republish to Normal Queue]
    MANUAL_CHECK -->|Discard| DISCARD[Remove Message]
    MANUAL_CHECK -->|Store for Analysis| STORE[Store in Database/Log]

    REPUBLISH --> MSG
    DISCARD --> END2([End - Discarded])
    STORE --> END3([End - Archived])

    style SUCCESS fill:#4CAF50,color:#fff
    style ERROR fill:#F44336,color:#fff
    style DLX_ROUTE fill:#FF9800,color:#fff
    style MANUAL_CHECK fill:#2196F3,color:#fff
    style END1 fill:#8BC34A
    style END2 fill:#9E9E9E
    style END3 fill:#607D8B
```

---

## Queue Configuration Map

```mermaid
mindmap
  root((RabbitMQ DLX<br/>Configuration))
    Normal Exchange
      Name: notification_exchange
      Type: Direct
      Durable: true
      Routing Key
        notification_routing_key
    Normal Queue
      Name: notification_queue_processing
      exclusive: false
      DLX Config
        deadLetterExchange: notification_exchange_dlx
        deadLetterRoutingKey: notification_routing_key_dlx
      Bindings
        Exchange: notification_exchange
        Routing: notification_routing_key
    DLX Exchange
      Name: notification_exchange_dlx
      Type: Direct
      Durable: true
      Routing Key
        notification_routing_key_dlx
    DLX Queue
      Name: notification_queue_hot_fix
      exclusive: false
      No DLX Config
      Bindings
        Exchange: notification_exchange_dlx
        Routing: notification_routing_key_dlx
    Message Options
      TTL
        expiration: 5000 ms
      Persistence
        Can set persistent: true
      Priority
        Can set priority levels
```

---

## Consumer Interaction Diagram

```mermaid
sequenceDiagram
    autonumber
    participant App as Application
    participant Prod as Producer<br/>(producerDLX.js)
    participant Rabbit as RabbitMQ Server
    participant ConsNorm as Normal Consumer<br/>(consumerToQueueNormal)
    participant ConsFail as DLX Consumer<br/>(consumerToQueueFail)

    Note over App,ConsFail: Setup Phase
    App->>Prod: Initialize Producer
    Prod->>Rabbit: Connect & Create Channel
    Prod->>Rabbit: Assert Exchange & Queue with DLX
    Prod->>Rabbit: Bind Queue to Exchange

    App->>ConsNorm: Start Normal Consumer
    ConsNorm->>Rabbit: Connect & Subscribe to<br/>notification_queue_processing

    App->>ConsFail: Start DLX Consumer
    ConsFail->>Rabbit: Connect & Subscribe to<br/>notification_queue_hot_fix

    Note over App,ConsFail: Normal Processing
    App->>Prod: Send Message
    Prod->>Rabbit: Publish with TTL: 5s
    Rabbit->>Rabbit: Start TTL Timer
    Rabbit->>ConsNorm: Deliver Message
    ConsNorm->>ConsNorm: Process Message
    ConsNorm->>Rabbit: ACK
    Rabbit->>Prod: Confirm Delivered

    Note over App,ConsFail: DLX Processing (TTL Expired)
    App->>Prod: Send Message
    Prod->>Rabbit: Publish with TTL: 5s
    Rabbit->>Rabbit: Start TTL Timer
    Note over ConsNorm: Consumer Not Available
    Rabbit->>Rabbit: Wait 5 seconds...
    Rabbit->>Rabbit: TTL Expired!
    Rabbit->>Rabbit: Auto-route to DLX
    Rabbit->>ConsFail: Deliver to DLX Queue
    ConsFail->>ConsFail: Log Failed Message
    Note over ConsFail: Auto-ACK (noAck: true)
    ConsFail-->>App: Alert: Manual Fix Needed
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph K8s["Kubernetes Cluster / Docker Compose"]
        subgraph ProdPod["Producer Pod/Container"]
            ProdApp[Producer Application<br/>producerDLX.js]
        end

        subgraph RabbitPod["RabbitMQ Pod/Container"]
            RabbitMQ[(RabbitMQ Server<br/>Port: 5672<br/>Management: 15672)]
            RabbitStorage[(Persistent Volume<br/>Queue Data)]
            RabbitMQ --- RabbitStorage
        end

        subgraph ConsumerPod["Consumer Pod/Container"]
            ConsApp[Consumer Service<br/>consumerQueue.service.js]
            ConsNormal[consumerToQueueNormal]
            ConsFail[consumerToQueueFail]
            ConsApp --> ConsNormal
            ConsApp --> ConsFail
        end

        subgraph MonitorPod["Monitoring"]
            Prometheus[Prometheus<br/>Metrics]
            Grafana[Grafana<br/>Dashboards]
            Prometheus --> Grafana
        end
    end

    subgraph External["External Services"]
        DB[(Database<br/>Failed Message Log)]
        Alert[Alert Service<br/>Email/Slack]
    end

    ProdApp -->|AMQP| RabbitMQ
    RabbitMQ -->|AMQP| ConsNormal
    RabbitMQ -->|AMQP| ConsFail

    RabbitMQ -.->|Metrics| Prometheus
    ConsApp -.->|Metrics| Prometheus

    ConsFail -.->|Log Failed Msgs| DB
    ConsFail -.->|Alert on Failures| Alert

    style ProdApp fill:#90CAF9
    style RabbitMQ fill:#FFB74D
    style ConsNormal fill:#81C784
    style ConsFail fill:#E57373
    style DB fill:#9575CD
    style Alert fill:#F06292
```

---

## Message Headers & Metadata

```mermaid
classDiagram
    class Message {
        +String content
        +Properties properties
        +Fields fields
        +Headers headers
    }

    class Properties {
        +String contentType
        +String contentEncoding
        +Number deliveryMode
        +Number priority
        +String correlationId
        +String replyTo
        +String expiration
        +String messageId
        +Timestamp timestamp
        +String type
        +String userId
        +String appId
    }

    class Fields {
        +String consumerTag
        +Number deliveryTag
        +Boolean redelivered
        +String exchange
        +String routingKey
    }

    class Headers {
        +String x-death[]
        +Number x-message-ttl
        +String x-expires
        +Number x-max-length
        +String x-first-death-reason
        +String x-first-death-queue
        +String x-first-death-exchange
    }

    class DLXHeaders {
        +String reason: "expired"
        +Number count: 1
        +String queue: "notification_queue_processing"
        +String exchange: ""
        +Array routing-keys
        +Timestamp time
    }

    Message --> Properties
    Message --> Fields
    Message --> Headers
    Headers --> DLXHeaders: When in DLX
```

---

## How to View These Diagrams

### Option 1: GitHub/GitLab
- Push this file to GitHub/GitLab
- Mermaid diagrams render automatically

### Option 2: VS Code
- Install "Markdown Preview Mermaid Support" extension
- Open this file and preview (Ctrl+Shift+V)

### Option 3: Online Mermaid Editor
- Visit: https://mermaid.live/
- Copy/paste any diagram code

### Option 4: Export as Images
- Use Mermaid CLI: `mmdc -i input.md -o output.png`

---

## Diagram Legend

| Color | Meaning |
|-------|---------|
| Blue | Producer/Publisher components |
| Yellow/Orange | Normal Exchange & Queue |
| Red/Pink | DLX Exchange & Queue |
| Green | Successful processing |
| Light Orange | Triggers/Conditions |

| Line Style | Meaning |
|------------|---------|
| Solid → | Normal message flow |
| Dashed -.-> | Error/DLX routing |
| Bold ====> | Critical path |

---

## Related Documentation

- Main Documentation: [RabbitMQ_DLX_Implementation.md](RabbitMQ_DLX_Implementation.md)
- Producer Code: [api-nodejs/tests/message_queue/rabbitMQ/producerDLX.js](../api-nodejs/tests/message_queue/rabbitMQ/producerDLX.js)
- Consumer Code: [sys-message-queue/src/services/consumerQueue.service.js](../sys-message-queue/src/services/consumerQueue.service.js)
