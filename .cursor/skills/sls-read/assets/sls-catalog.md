# UU SLS (Second Line Support) Catalog

Generated: 2026-03-28
Source: Extracted from aboutBook pages of 669+ BookKit documentation books
Total unique SLS instances: **112**

## How SLS Works

- Each SLS instance has an AWID and is accessible at `https://uuapp.plus4u.net/uu-sls-maing01/{AWID}/issueList`
- Each SLS instance contains **topics** (products/components) organized in a `productMap`
- Topics can be loaded via `GET {baseUri}/uuSls/load` → `response.productMap`
- Issues are filed against a specific topic within an SLS instance
- The `topicCode` field on issues corresponds to the topic's `code` in productMap

## Quick Reference: "I need to report an issue about X"

| If your issue is about... | Use this SLS | AWID |
|---|---|---|
| **uuEntityManagement** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `entitymanagement`) |
| **uuProcessManagement** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `uu_process_management`) |
| **uuBpmEngine** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `bpmEngine`) |
| **uuSecurityKit** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `uu_securitykit`) |
| **uuPerfMon** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `uu_perfmon`) |
| **uuPipeline/TeamCity** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `uuPipeline`) |
| **uuGitLab** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `uuGitLab`) |
| **uuNotifications** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `uuNotifications`) |
| **uuAppMessageBroker-Kafka** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `uuAppMessageBroker-Kafka`) |
| **uuCloudg02 automation** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `uuCloudg02automation`) |
| **Enterprise Identity Management** | Contribution Hub | `e0d7bd173d5a4638a6a5f540fcd34f7e` (topic: `eidm`) |
| **uuCloud (AppBoxRegistry)** | uuCloud g02 | `33053d4f7504459f8ada5cf96500548a` (topic: `appBoxRegistry`) |
| **uuCloud (CDN)** | uuCloud g02 | `33053d4f7504459f8ada5cf96500548a` (topic: `cdn`) |
| **uuCloud (DevKit)** | uuCloud g02 | `33053d4f7504459f8ada5cf96500548a` (topic: `devKit`) |
| **uuCloud (Gateway)** | uuCloud g02 | `33053d4f7504459f8ada5cf96500548a` (topic: `gateway`) |
| **uuCloud (LogStore)** | uuCloud g02 | `33053d4f7504459f8ada5cf96500548a` (topic: `logStore`) |
| **uuCloud (Monitoring)** | uuCloud g02 | `33053d4f7504459f8ada5cf96500548a` (topic: `monitoring`) |
| **uuCloud (Universe)** | uuCloud g02 | `33053d4f7504459f8ada5cf96500548a` (topic: `universe`) |
| **uuCloud (WorkloadHub)** | uuCloud g02 | `33053d4f7504459f8ada5cf96500548a` (topic: `workloadHub`) |
| **uuAppServer NodeJS** | uuAppServer NodeJS | `93748ca422c44cf5b2184a0e8981bb72` |
| **uuAppServer Java** | uuAppServer Java | `6546bf45f4954790a2ed86f1ac85d8b5` |
| **uuBusinessTerritory** | uuBusinessTerritory | `4af63c9bf8f3486f84e894c4de740e87` |
| **uuMyTerritory / DigitalWorkspace** | uuMyTerritory | `db486d76a8ba432fbca1821d6a7578c2` |
| **uuManagementKit** | uuManagementKit | `9746cde8c40548e08bc476ab2615a87c` |
| **uuBookKit** | uuBookKit | `d127521164ef4a689e37fe6968d1c7ab` |
| **uuOidc** | uuOidc | `9df53aba7b4e4eef92073740ae522220` |
| **uuIdentityManagement** | uuIdentityManagement | `7760ddd97ba34835b8504225eb3ac453` |
| **uuConsole** | uuConsole | `805720ebdd98478c833af6fc59d421f5` |
| **uuBEM** | uuBEM | `efc9412a1e0d4ff4bb46edc6bf4455bf` |
| **uuScriptEngine** | uuScriptEngine | `049eaa6dc80f4723b33dc6a3e9e2ecdb` |
| **uuScriptRepository** | uuScriptRepository | `9d5958f66bbc41b09577ae2adb17e531` |
| **uuAsyncJob** | uuAsyncJob | `3005e339eead41ba9c61828927d66517` |
| **uuBinaryStore** | uuBinaryStore | `5d62e967ba0d43abab41b11465bbfd61` |
| **uuWebKit** | uuWebKit | `21c3be65d70e49dcae91ce6c270a2313` |
| **uuDocKit** | uuDocKit | `d4698eb7498347099440231fdc7e42c1` |
| **uu5 (g04) / HumanInterface** | uu5/uuHumanInterface | `e80acdfaeb5d46748a04cfc7c10fdf4e` |
| **uuElementaryManagement** | uuElementaryManagement | `c8f0486487f64c73822259a6cdf0d012` |
| **uuEcc/Ebc/Esc (BusinessBrick)** | uuBusinessBrick | `2153d855963f4d49ac0abc9b6ea3cfa1` |
| **uuForum** | uuForum | `4cc7fb7d7c9940e08c34a799c12ad42b` |
| **uuFinMan** | uuFinMan | `b328af7225484a9fba5169d837cafac6` |
| **uuEnelane** | uuEnelane | `f7d9caed0c054382a366f85148809108` |
| **uuTimeSeries** | uuTimeSeries | `97922e65d1d54fc697945260bd5c8458` |

## Full Catalog by Category

### Infrastructure & Cloud (21 SLS instances)

| AWID | Name | Known Topics |
|---|---|---|
| `33053d4f7504459f8ada5cf96500548a` | **uuCloud g02** | appBoxRegistry, cdn, devKit, forwarder, gateway, logStore, monitoring, technologyPlatform, threatDetection, universe, uuCloudStandard, workloadHub, uuCloudg01 |
| `93748ca422c44cf5b2184a0e8981bb72` | **uuAppServer NodeJS** | (default), uuappobjectstore, uuappruntimestack, uuappworkspace, uuapptelemetry, uuappmessagebroker, uuappoidc, uuappstatus, uuapprepresentation, uuappauditlog, uuappcache |
| `6546bf45f4954790a2ed86f1ac85d8b5` | uuAppServer Java | - |
| `3f1ef221518d49f2ac936f53f83ebd84` | uuAppServer (general/BR) | - |
| `d03f049e7aa44061985cb26fd4ac6512` | uuBaseRegistry | - |
| `e4e2a862d4484741999eb4eda255ffac` | uuAppProviderKit | - |
| `0f633bc749a1470db1db36e078edd559` | uuAppLogStore | - |
| `a1303ca4223c48ae80ce100ada0f1553` | uuAppSecondaryLogStore | - |
| `2cd22e34ca8b4a95ad79672cf5db80a2` | uuAppLibraryRegistry | - |
| `5d62e967ba0d43abab41b11465bbfd61` | uuBinaryStore | - |
| `3005e339eead41ba9c61828927d66517` | uuAsyncJob | - |
| `3656e2ced07f482683013502e7623460` | uuAppRepository | - |
| `21d64a73d0004e8fab8f742d448f1dd2` | uuAlerts | - |
| `a7d8cb829c544ca688b201ae045335ec` | uuAppMessageBroker | - |
| `cb4632634ffa47e78edd22b33f6969b4` | uuCodebase | - |
| `2e8c03cf5d3344ba8564e909795b1018` | uuCloudC3 | - |
| `4b7c763afb524c50b340c779ffe3e181` | uuCloudCDN (old) | - |
| `f8a691db407747e191bdbae78f0e32a7` | uuCloudLogStore g01 | - |
| `0a9ab8d4202042b0858ac8d4b7c36ab1` | uuCloudMonitoring g01 | - |
| `3875fad2d669484faa5e1f349a25960b` | uuCloudOperationRegistry | - |
| `8e4e3003b86d429796b1f9509dfef3c6` | uuGateway g01 | - |

### Identity & Security (5)

| AWID | Name |
|---|---|
| `9df53aba7b4e4eef92073740ae522220` | uuOidc |
| `7760ddd97ba34835b8504225eb3ac453` | uuIdentityManagement |
| `922ffcc6adae4623ac72f25ed3b8c8b6` | uuIdGuard |
| `70f62c09b6014dd9a26bbfaad478154f` | uuLicenseKit |
| `2c722860401f463a98b2aa3869e939ab` | uuApp Security Framework |

### Territory & Organization (7)

| AWID | Name | Known Topics |
|---|---|---|
| `4af63c9bf8f3486f84e894c4de740e87` | **uuBusinessTerritory** | (default), nodeJs |
| `db486d76a8ba432fbca1821d6a7578c2` | **uuMyTerritory** | (default), uuMyTerritorynewstructure |
| `aae3b77328b14caeb5ff5eb1fd909fab` | uuTerritoryEventBroker | - |
| `b516cefce09c457aa1171fa0b13b878a` | uuP | - |
| `558dcc308da34b82bbe044d94074802f` | uuPlus4U5 | - |
| `47aa738b9d304f6c8827172085d7bbe6` | uuPlus4UGo | - |
| `91c727bceb964aeda09865cfdf963e59` | uuPlus4UOrganization | - |

### Development Tools (14)

| AWID | Name | Known Topics |
|---|---|---|
| `e0d7bd173d5a4638a6a5f540fcd34f7e` | **Contribution Hub** | entitymanagement, uu_process_management, uu_energy_common, eidm, uuPipeline, uuGitLab, uuNotifications, uuAppMessageBroker-Kafka, bpmEngine, uuCloudg02automation, uuAppLogStore, uu_securitykit, uu_perfmon |
| `805720ebdd98478c833af6fc59d421f5` | uuConsole | - |
| `049eaa6dc80f4723b33dc6a3e9e2ecdb` | uuScriptEngine | - |
| `9d5958f66bbc41b09577ae2adb17e531` | uuScriptRepository | - |
| `f34e4c65a9c84ea0baf50017c43fc97d` | uuAppDevKit | - |
| `931e9b6805be47dbb1342acb82c83e5e` | uuAppDesignKit | - |
| `a990e0dcc76c45149076257b0a02a075` | uuAppBusinessModelKit | - |
| `a9ea58a423114548b3be39c669855d89` | uuAppModelKit | - |
| `71714e84cb7c49e18daf297ccb3380b7` | uuGraphicDesignSystem | - |
| `5e8eee48ab874cd69f7d9791e4ffb3a6` | uuGraphicDesignSystem (BR) | - |
| `e80acdfaeb5d46748a04cfc7c10fdf4e` | uu5/uuHumanInterface (g04) | - |
| `60b8c1a8ec1347c8ac02e65b395c50c8` | CRUD/Textbooks | - |
| `3c440c47fc1f4ba4bc78e64f571835dc` | AI Patterns / uuApp Patterns | - |
| `f577e37566eb4181b37f10d27f7e472d` | SWF Tools | - |

### Content & Documentation (13)

| AWID | Name | Known Topics |
|---|---|---|
| `9746cde8c40548e08bc476ab2615a87c` | **uuManagementKit** | (default), meeting, Email, allTypes |
| `d127521164ef4a689e37fe6968d1c7ab` | uuBookKit | - |
| `d4698eb7498347099440231fdc7e42c1` | uuDocKit | - |
| `21c3be65d70e49dcae91ce6c270a2313` | uuWebKit | - |
| `c8f0486487f64c73822259a6cdf0d012` | uuElementaryManagement | - |
| `2153d855963f4d49ac0abc9b6ea3cfa1` | uuEcc/Ebc/Esc (BusinessBrick) | - |
| `1719f390d5264e7b802d48c7d8525428` | uuEcc g02 | - |
| `5333b09112a84b3480176e0a55357789` | uuFulltextSearch | - |
| `801f738aad6547a2a798f5bda56b9339` | uuNewsKit | - |
| `8199f9caeeb54f8d8b065c7df74a7cb5` | uuBmlDraw | - |
| `0fbc970eac224575a34660b024f44086` | uuBmlg04 | - |
| `cebdfed9208c4d3dbbaa0c721e4abc2a` | uuPdfConverter | - |
| `5989918fd18b421aac6e7358ff07fd6f` | uuMagicPicture | - |

### Communication & Collaboration (7)

| AWID | Name |
|---|---|
| `4cc7fb7d7c9940e08c34a799c12ad42b` | uuForum |
| `15ed9e5f096d42619315e67dd427bdf7` | uuMailBox |
| `6823a2c688524253bd700a621d5f165f` | uuMediaStreamingService |
| `77eb9cf4cee64fd7a7e2725c73883144` | uuNotificationService |
| `5e53e6c64aff48e6848d4795088b271c` | uuBusinessChat |
| `4afb155541e04e5999a9a2dbe32062d8` | uuAiChat |
| `e8b2d71a9f2f48d1baccc1974823acd5` | uuPostFetchFilter |

### Finance & Commerce (13)

| AWID | Name |
|---|---|
| `b328af7225484a9fba5169d837cafac6` | uuFinMan |
| `4e4f642e3e0d45e48e9f6cce0eead991` | uuBudgetMan |
| `52ce1a5269c34fef87ede62fb5ea2be5` | uuBank |
| `7ef1785d23d64f1ca2fb92fe966ca9ee` | uuBill |
| `01356c3b499f41c2bcb4b1fa0802af8e` | uuFinancialContract |
| `73380bae6b954724bcee79351cf08a4e` | uuPaymentGateway |
| `72324a093f0c45e799af3bea166efe32` | uuPlus4uFairPay |
| `68d19026ef5f4e7fa299e9c276318c26` | uuPlus4UMall |
| `9f54df187ea9409f8bade414e0bdc87a` | uuMallInvoice |
| `9ec414fcb2014edf9c7d1caa38cfc01d` | uuShopMan |
| `2c4e53d50d1b4bb2a3ef5a2ee3f3040c` | uuShopMang06 |
| `1a8f7e086b074936bbae40aae0621f45` | uuSalesKit |
| `f2f29c9dc4324b3e961e5518e7143863` | uuContractKit |

### Education & Training (7)

| AWID | Name |
|---|---|
| `cc17e1d52d094a868f824ea41f02c790` | uuCourseKit g01 |
| `b512da6e83d644b0a7544be5f0f6bd6e` | uuCourseKit g02 |
| `b3d01e917d8d4b92a6ff544e6b5d8404` | uuStudyEngine |
| `9bc9091d5ac34b119ac577db0bdd7375` | uuUniversityKit |
| `b1791767c61c454fbf67050ffd332890` | uuCertification |
| `ba82efa25a0541fcbcc8affc5e28be11` | uuKnowHowKit |
| `4e0daf426c314e019e89ed5dc870fa89` | uuTimetableKit |

### Business Applications (19)

| AWID | Name |
|---|---|
| `b0af3935d4c04ec1ba5abf70d6bfb4ef` | uuBusinessRequestMan |
| `183b65639e384fa5afe3027e54e6a2d7` | uuSprintMan g01 |
| `b3f67cb27a744fb99b767884de15cdf5` | uuSprintMan g02 |
| `5e40c69b4ef440a6ba0bc36dd03b4895` | uuFls |
| `a3d93bb457a24a409552d01429954f35` | uuSls |
| `1c2603e048f743098b18aa9cc897347d` | uuSolutionExchange |
| `0651936f01aa4456934e40d87f7defce` | uuBookigy/BookingEngine |
| `3324f0fc341840cb8cd90ee59c627661` | uuClubFiles |
| `e0ee05ee5cfb42c7a9ffaf7ba1c722e1` | uuCollectibles |
| `634ed86720484dd19d94ee7c9bf9000d` | uuCommonServices |
| `127851e77a9d4336aa5d867b8d694eb8` | uuDomainManagement |
| `32fb8d159e464f1690a8dc1365ceb6b1` | uuGoodymat |
| `2f6374611b554ec68be17520fa66ef56` | uuJokes |
| `29159dd1d1c34d2da09f743aceedaeb0` | uuKnowledgeExchange |
| `23b05947593f437f9e8fef9e643d4438` | uuMobile |
| `ebab45f7a3e647bd9cd53468d68b73ca` | uuRecruitmentManagement |
| `aa5a025404d64f0b8e59f2880dcdd1c9` | uuSpecialistExchange |
| `26f554f59df84234a3304384c4c18956` | uuTags |
| `dc8980140c414a5e8794750fd3023e9e` | uuAssistant |

### Energy & IoT (5)

| AWID | Name |
|---|---|
| `f7d9caed0c054382a366f85148809108` | uuEnelane |
| `97922e65d1d54fc697945260bd5c8458` | uuTimeSeries |
| `e76f3d93ae3d4e6d9198f7ff5073eef3` | uuGriffin |
| `79f22e6f3d5242d6a26235b54ec2bbff` | uuDamasMMS |
| `1cec5ef9c8784eeeb4148082835d5e99` | uuChargeUp |

### BEM (1)

| AWID | Name |
|---|---|
| `efc9412a1e0d4ff4bb46edc6bf4455bf` | uuBEM |

## API Notes

- **Get all topics for an SLS instance:** `GET https://uuapp.plus4u.net/uu-sls-maing01/{AWID}/uuSls/load` → `response.productMap`
- **List issues:** `GET https://uuapp.plus4u.net/uu-sls-maing01/{AWID}/issue/list?filterMap.state[0]=sent&pageInfo.pageSize=100`
- **Get tags:** `GET https://uuapp.plus4u.net/uu-sls-maing01/{AWID}/tags/get?objectType=uu-sls-maing01/issue`
- **Topic management:** `topic/create`, `topic/load`, `topic/list`, `topic/update`, `topic/delete`
- Topics have a `code`, `name`, `desc`, `operatorData` (default solver), and `transferUri`
