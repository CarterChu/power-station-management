<template>
  <div class="detail-page">
    <!-- 固定顶栏 -->
    <div class="detail-header">
      <div class="detail-header-left">
        <a-button type="text" class="back-btn" @click="emit('back')">
          <template #icon><LeftOutlined /></template>
        </a-button>
        <a-tooltip :title="detail.projectName">
          <span class="detail-title">{{ detail.projectName }}</span>
        </a-tooltip>
        <span class="node-dot-tag"><span class="node-dot-tag__dot" style="background:#1677ff"></span>建档</span>
        <a-tag :color="STATUS_COLOR[detail.filingStatus]">
          {{ STATUS_LABEL[detail.filingStatus] }}
        </a-tag>
        <span class="detail-header-meta">
          <span class="detail-header-meta-item">{{ detail.stationType }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ props.policyType === 'nonstandard' ? PROJECT_TYPE_LABEL[detail.projectType] : '公建 EMC' }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ props.policyType === 'nonstandard' ? '非标政策' : '标准政策' }}</span>
          <span class="detail-header-meta-divider" />
          <span class="detail-header-meta-item">{{ detail.stationNo }}<CopyOutlined class="copy-icon" @click="copyStationNo(detail.stationNo)" /></span>
        </span>
      </div>
      <a-space>
        <a-popconfirm
          v-if="canVoid"
          title="确认作废该建档？"
          description="作废后电站编号与 OA 单号的关联将解除，且不可恢复。"
          ok-text="确认作废" ok-type="danger" cancel-text="取消"
          @confirm="handleVoid"
        >
          <a-button danger>作废</a-button>
        </a-popconfirm>
        <a-button v-if="canEdit" type="primary" @click="handleEdit">修改</a-button>
      </a-space>
    </div>

    <div class="detail-body" ref="detailBodyRef">
      <!-- 左侧：只读 TAB 内容 -->
      <div class="detail-main">

        <!-- 退回原因卡片（仅审核不通过时展示） -->

        <!-- ── 项目信息 ── -->
        <div class="detail-card detail-card--plain">
          <div class="section-title section-title--toggle" :class="{ 'section-title--collapsed': !projectInfoOpen }" @click="projectInfoOpen = !projectInfoOpen">项目信息<DownOutlined class="section-toggle-icon" :class="{ rotated: projectInfoOpen }" /></div>
          <div v-show="projectInfoOpen">

          <!-- 标准政策布局 -->
          <template v-if="props.policyType !== 'nonstandard'">
            <div class="info-section" style="margin-top:0">
              <div class="info-section-title">基本信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">电站类型</span><span class="info-value">{{ detail.stationType }}</span></div>
                <div class="info-item"><span class="info-label">项目名称</span><span class="info-value">{{ detail.projectName }}</span></div>
                <div class="info-item"><span class="info-label">项目类型</span><span class="info-value">{{ '公建 EMC' }}</span></div>
                <div class="info-item"><span class="info-label">匹配政策</span><span class="info-value">标准政策</span></div>
                <div class="info-item"><span class="info-label">所属区域公司</span><span class="info-value">{{ detail.regionCompany }}</span></div>
                <div class="info-item"><span class="info-label">项目地址</span><span class="info-value">{{ detail.region.join(' / ') }}</span></div>
                <div class="info-item"><span class="info-label">详细地址</span><span class="info-value">{{ detail.addressDetail }}</span></div>
                <div class="info-item"><span class="info-label">项目容量</span><span class="info-value">{{ detail.capacity }} kW</span></div>
                <div class="info-item"><span class="info-label">并网电压等级</span><span class="info-value">{{ GRID_VOLTAGE_LABEL[detail.gridVoltage] }}</span></div>
                <div class="info-item"><span class="info-label">代理商名称</span><span class="info-value">{{ detail.agentName }}</span></div>
                <div class="info-item"><span class="info-label">用电企业名称</span><span class="info-value">{{ detail.userEntName }}</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">供应商信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">开发商名称</span><span class="info-value">{{ detail.developerName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">施工商名称</span><span class="info-value">{{ detail.constructorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">监理商名称</span><span class="info-value">{{ detail.supervisorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">设计商名称</span><span class="info-value">{{ detail.designerName || '—' }}</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">EMC信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">EMC 电价</span><span class="info-value">{{ detail.emcPrice }} 元/kWh</span></div>
                <div class="info-item"><span class="info-label">EMC 年限</span><span class="info-value">{{ detail.emcYears }} 年</span></div>
                <div class="info-item"><span class="info-label">消纳比例</span><span class="info-value">{{ detail.consumptionRate }}%</span></div>
                <div v-if="detail.projectType === 'public_emc'" class="info-item"><span class="info-label">公建机构类型</span><span class="info-value">{{ PUBLIC_BUILD_TYPE_LABEL[detail.publicBuildType] || '—' }}</span></div>
              </div>
            </div>
            <div class="info-section" style="border-top: none; padding-top: 0">
              <div class="info-grid">
                <div class="info-item info-item--span2"><span class="info-label">产权证明</span><span class="info-value"><FileAttachmentView v-if="detail.propertyProof?.length" :files="detail.propertyProof" /><span v-else>—</span></span></div>
                <div class="info-item info-item--span2"><span class="info-label">营业执照/组织机构代码证</span><span class="info-value"><FileAttachmentView v-if="detail.bizLicense?.length" :files="detail.bizLicense" /><span v-else>—</span></span></div>
                <div class="info-item info-item--span2"><span class="info-label">开户许可证</span><span class="info-value"><FileAttachmentView v-if="detail.bankAccountCert" :files="[detail.bankAccountCert]" /><span v-else>—</span></span></div>
                <div class="info-item" style="grid-column-start:1"><span class="info-label">法定代表人身份证正面</span><div class="id-card-img id-card-img--front" v-if="detail.idCardFront" /><span v-else>—</span></div>
                <div class="info-item"><span class="info-label">法定代表人身份证反面</span><div class="id-card-img id-card-img--back" v-if="detail.idCardBack" /><span v-else>—</span></div>
              </div>
            </div>
            <div class="info-section">
              <div class="info-section-title">项目产权信息</div>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">项目公司</span><span class="info-value">{{ detail.projectCompany || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EPC 公司</span><span class="info-value">{{ detail.epcCompany || '—' }}</span></div>
                <div class="info-item"><span class="info-label">产权公司</span><span class="info-value">{{ detail.ownershipCompany || '—' }}</span></div>
              </div>
            </div>
          </template>

          <!-- 非标政策布局（平铺，无子标题） -->
          <template v-else>
            <div class="info-section" style="margin-top:0">
              <div class="info-grid">
                <div class="info-item"><span class="info-label">OA编号</span><span class="info-value">{{ detail.oaNo || '—' }}</span></div>
                <div class="info-item"><span class="info-label">项目名称</span><span class="info-value">{{ detail.projectName }}</span></div>
                <div class="info-item"><span class="info-label">项目类型</span><span class="info-value">{{ PROJECT_TYPE_LABEL[detail.projectType] }}</span></div>
                <div class="info-item"><span class="info-label">是否政策匹配</span><span class="info-value">否</span></div>
                <div class="info-item"><span class="info-label">省市区</span><span class="info-value">{{ detail.region?.join(' / ') || '—' }}</span></div>
                <div class="info-item info-item--span2"><span class="info-label">详细地址</span><span class="info-value">{{ detail.addressDetail || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EMC 年限</span><span class="info-value">{{ detail.emcYears }} 年</span></div>
                <div class="info-item"><span class="info-label">项目容量</span><span class="info-value">{{ detail.capacity }} kW</span></div>
                <div class="info-item"><span class="info-label">并网电压等级</span><span class="info-value">{{ GRID_VOLTAGE_LABEL[detail.gridVoltage] }}</span></div>
                <div class="info-item"><span class="info-label">代理商名称</span><span class="info-value">{{ detail.agentName }}</span></div>
                <div class="info-item"><span class="info-label">用电企业名称</span><span class="info-value">{{ detail.userEntName }}</span></div>
                <div class="info-item"><span class="info-label">开发商名称</span><span class="info-value">{{ detail.developerName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">施工商名称</span><span class="info-value">{{ detail.constructorName || '—' }}</span></div>
                <div class="info-item"><span class="info-label">EMC 电价</span><span class="info-value">{{ detail.emcPrice }} 元/kWh</span></div>
                <div class="info-item"><span class="info-label">消纳比例</span><span class="info-value">{{ detail.consumptionRate }}%</span></div>
                <div class="info-item"><span class="info-label">公建机构类型</span><span class="info-value">{{ PUBLIC_BUILD_TYPE_LABEL[detail.publicBuildType] || '—' }}</span></div>
                <div class="info-item info-item--span2" style="grid-column-start:1"><span class="info-label">产权证明</span><span class="info-value"><FileAttachmentView v-if="detail.propertyProof?.length" :files="detail.propertyProof" /><span v-else>—</span></span></div>
              </div>
            </div>
          </template>
          </div>
        </div>


        <div class="tabs-wrapper" ref="tabsWrapperRef" :class="{ 'tabs-stuck': tabsStuck }">
          <a-tabs
            v-model:active-key="activeTab"
            class="detail-tabs"
            :tab-bar-style="{ padding: tabsStuck ? '0 24px' : '8px 24px 0', marginBottom: 0 }"
            @tab-click="scrollToTabNav"
          >
            <!-- ──────── 勘察 TAB ──────── -->
            <a-tab-pane key="survey" tab="勘察">
              <div class="tab-body">

                <!-- 项目总体概况 -->
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">项目总体概况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">建筑数量</span>
                      <span class="info-value">{{ detail.buildingCount != null ? detail.buildingCount + ' 个' : '—' }}</span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">屋面类型</span>
                      <span class="info-value">
                        <template v-if="detail.roofLightSteel || detail.roofConcrete || detail.roofOther">
                          <span v-if="detail.roofLightSteel">轻钢结构屋面 {{ detail.roofLightSteel }} 个</span>
                          <span v-if="detail.roofLightSteel && detail.roofConcrete">　</span>
                          <span v-if="detail.roofConcrete">混凝土屋面 {{ detail.roofConcrete }} 个</span>
                          <span v-if="(detail.roofLightSteel || detail.roofConcrete) && detail.roofOther">　</span>
                          <span v-if="detail.roofOther">其他 {{ detail.roofOther }} 个</span>
                        </template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">总平面布置图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.siteLayoutFiles?.length" :files="detail.siteLayoutFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 每个建筑的屋面情况 -->
                <div class="info-section">
                  <div class="info-section-title">每个建筑的屋面情况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">彩钢瓦瓦型</span>
                      <span class="info-value">{{ STEEL_ROOF_LABEL[detail.steelRoofType] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">瓦面锈蚀情况</span>
                      <span class="info-value">{{ RUST_LABEL[detail.rustCondition] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">屋面是否有障碍物</span>
                      <span class="info-value">
                        <template v-if="detail.hasObstacle === 'yes'">有，高 {{ detail.obstacleHeight }}m / 宽 {{ detail.obstacleWidth }}m</template>
                        <template v-else-if="detail.hasObstacle === 'no'">无</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">屋面是否有采光带</span>
                      <span class="info-value">
                        <template v-if="detail.hasSkylight === 'yes'">有，采光带宽度 {{ detail.skylightWidth }}mm</template>
                        <template v-else-if="detail.hasSkylight === 'no'">无</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 用户配电情况 -->
                <div class="info-section">
                  <div class="info-section-title">用户配电情况</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">进线电压等级</span>
                      <span class="info-value">{{ detail.inletVoltage != null ? detail.inletVoltage + ' kV' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">用户进线接入方式</span>
                      <span class="info-value">{{ INLET_CONN_LABEL[detail.inletConnectionType] || '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">进线回路数</span>
                      <span class="info-value">{{ detail.circuitCount != null ? detail.circuitCount + ' 回' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">进线电缆规格</span>
                      <span class="info-value">{{ detail.cableSpec != null ? detail.cableSpec + ' mm²' : '—' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">用户变压器</span>
                      <span class="info-value">{{ detail.transformerCount != null ? detail.transformerCount + ' 台，共 ' + detail.transformerKVA + ' kVA' : '—' }}</span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">是否具备接入间隔</span>
                      <span class="info-value">{{ INTERVAL_LABEL[detail.hasInterval] || '—' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 光伏设备放置及布线条件 -->
                <div class="info-section">
                  <div class="info-section-title">光伏设备放置及布线条件</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">光伏设备放置条件</span>
                      <span class="info-value">
                        <template v-if="detail.hasIndoorSpace === 'yes'">有室内空间，{{ detail.indoorLength }}m × {{ detail.indoorWidth }}m</template>
                        <template v-else-if="detail.hasIndoorSpace === 'no'">无室内放置空间</template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">场内电缆管道情况</span>
                      <span class="info-value">{{ CABLE_PIPE_LABEL[detail.hasCablePipe] || '—' }}{{ detail.hasCablePipe === 'yes' && detail.cablePipeType ? '（' + CABLE_TYPE_LABEL[detail.cablePipeType] + '）' : '' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 勘察照片 -->
                <div class="info-section">
                  <div class="info-section-title">勘察照片</div>
                  <a-row :gutter="[24, 16]">
                    <a-col v-for="cat in PHOTO_CATEGORIES" :key="cat.key" :span="12">
                      <div class="photo-readonly-col">
                        <span class="photo-readonly-label">{{ cat.label }}</span>
                        <div class="photo-readonly-imgs">
                          <template v-if="detail.photos[cat.key]?.length">
                            <a-image v-for="(img, i) in detail.photos[cat.key]" :key="i" :src="img"
                              :width="80" :height="80" style="object-fit:cover;border-radius:4px" />
                          </template>
                          <span v-else class="empty-hint">—</span>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                </div>

                <!-- 项目图纸及用电情况 -->
                <div class="info-section">
                  <div class="info-section-title">项目图纸及用电情况</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">图纸</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.drawingFiles?.length" :files="detail.drawingFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">用电情况</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.electricityFiles?.length" :files="detail.electricityFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 接入批复 -->
                <div class="info-section">
                  <div class="info-section-title">接入批复</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">接入批复</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.approvalFiles?.length" :files="detail.approvalFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </a-tab-pane>

            <!-- ──────── 设计 TAB ──────── -->
            <a-tab-pane key="design" tab="设计">
              <div class="tab-body tab-body--design">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">甲供 BOM</div>
                  <a-table :columns="jiagongReadonlyColumns" :data-source="detail.jiagongBom" :pagination="false" size="small" :locale="{ emptyText: '暂无甲供物料' }" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">乙供中高/低压 BOM</div>
                  <a-table :columns="yigongReadonlyColumns" :data-source="detail.yigongBom" :pagination="false" size="small" :locale="{ emptyText: '暂无乙供中/低压物料' }" />
                </div>
                <div class="info-section">
                  <div class="info-section-title">上网模式</div>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">上网模式</span>
                      <span class="info-value">{{ GRID_MODE_LABEL[detail.gridMode] || '—' }}</span>
                    </div>
                  </div>
                </div>
                <div class="info-section">
                  <div class="info-section-title" style="margin-bottom:8px">应用场景</div>
                  <div style="font-size:14px;color:rgba(0,0,0,0.65);margin-bottom:12px">
                    应用场景是否混装：{{ detail.scenes.length > 1 ? '是' : '否' }}
                  </div>
                  <a-table
                    :columns="sceneColumns"
                    :data-source="detail.scenes"
                    :pagination="false"
                    size="small"
                  />
                </div>
                <div class="info-section">
                  <div class="info-section-title">设计附件</div>
                  <div class="info-grid">
                    <div class="info-item info-item--span2">
                      <span class="info-label">设计资质</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.designQualFiles?.length" :files="detail.designQualFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">电气设计图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.electricalDesignFiles?.length" :files="detail.electricalDesignFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">结构设计图</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.structuralDesignFiles?.length" :files="detail.structuralDesignFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">厂房结构安全性评估</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.safetyAssessFiles?.length" :files="detail.safetyAssessFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                    <div class="info-item info-item--span2">
                      <span class="info-label">其他附件</span>
                      <span class="info-value">
                        <FileAttachmentView v-if="detail.otherAttachFiles?.length" :files="detail.otherAttachFiles" />
                        <span v-else>—</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 商务 TAB ──────── -->
            <a-tab-pane key="commercial" tab="商务">
              <div class="tab-body tab-body--commercial">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">合同信息</div>

                  <!-- EMC协议 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">EMC协议（能源管理合同）</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.emcContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.emcContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.emcContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.emcContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.emcContract.amount != null ? detail.commercial.emcContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.emcContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.emcContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.emcContract.files?.length" :files="detail.commercial.emcContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 小E施工承包合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">小E施工承包合同（常规EMC）</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.smallEContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.smallEContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.smallEContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.smallEContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.smallEContract.amount != null ? detail.commercial.smallEContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.smallEContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.smallEContract.remark || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人姓名</span><span class="info-value">{{ detail.commercial.smallEContract.controllerName || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人身份证号</span><span class="info-value">{{ detail.commercial.smallEContract.controllerIdCard || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人配偶姓名</span><span class="info-value">{{ detail.commercial.smallEContract.controllerSpouseName || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">实控人配偶身份证号</span><span class="info-value">{{ detail.commercial.smallEContract.controllerSpouseIdCard || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.smallEContract.files?.length" :files="detail.commercial.smallEContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 设计合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">设计合同</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.designContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.designContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.designContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.designContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.designContract.amount != null ? detail.commercial.designContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.designContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.designContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.designContract.files?.length" :files="detail.commercial.designContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 监理合同 -->
                  <div class="contract-block-ro">
                    <div class="contract-block-ro-header">监理合同</div>
                    <div class="info-grid">
                      <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ detail.commercial.jianliContract.contractNo || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ detail.commercial.jianliContract.paymentCategory || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ detail.commercial.jianliContract.partyA || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ detail.commercial.jianliContract.partyB || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ detail.commercial.jianliContract.amount != null ? detail.commercial.jianliContract.amount + ' 元' : '—' }}</span></div>
                      <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ detail.commercial.jianliContract.signDate || '—' }}</span></div>
                      <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ detail.commercial.jianliContract.remark || '—' }}</span></div>
                      <div class="info-item info-item--span2"><span class="info-label">合同附件</span><span class="info-value">
                        <FileAttachmentView v-if="detail.commercial.jianliContract.files?.length" :files="detail.commercial.jianliContract.files" /><span v-else>—</span>
                      </span></div>
                    </div>
                  </div>

                  <!-- 其他合同 -->
                  <template v-if="detail.commercial.otherContracts?.length">
                    <div v-for="(c, idx) in detail.commercial.otherContracts" :key="idx" class="contract-block-ro">
                      <div class="contract-block-ro-header">其他合同{{ idx + 1 }}</div>
                      <div class="info-grid">
                        <div class="info-item"><span class="info-label">合同编号</span><span class="info-value">{{ c.contractNo || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同款项类别</span><span class="info-value">{{ c.paymentCategory || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">甲方</span><span class="info-value">{{ c.partyA || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">乙方</span><span class="info-value">{{ c.partyB || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同签订金额</span><span class="info-value">{{ c.amount != null ? c.amount + ' 元' : '—' }}</span></div>
                        <div class="info-item"><span class="info-label">合同签订日期</span><span class="info-value">{{ c.signDate || '—' }}</span></div>
                        <div class="info-item"><span class="info-label">备注</span><span class="info-value">{{ c.remark || '—' }}</span></div>
                      </div>
                    </div>
                  </template>
                </div>

              </div>
            </a-tab-pane>

            <!-- ──────── 备案 TAB ──────── -->
            <a-tab-pane key="record" tab="备案">
              <div class="tab-body">
                <div class="info-section" style="margin-top:0">
                  <div class="info-section-title">备案证信息</div>
                  <template v-if="detail.filingCert">
                    <div class="info-grid">
                      <div class="info-item">
                        <span class="info-label">备案证文件名</span>
                        <span class="info-value">{{ detail.filingCert.fileName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案类型</span>
                        <span class="info-value">{{ detail.filingCert.filingType }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证项目名称</span>
                        <span class="info-value">{{ detail.filingCert.projectName }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证项目代码</span>
                        <span class="info-value">{{ detail.filingCert.projectCode }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">产权公司</span>
                        <span class="info-value">{{ detail.filingCert.ownershipCompany }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证编号</span>
                        <span class="info-value">{{ detail.filingCert.certNo }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证容量(W)</span>
                        <span class="info-value">{{ detail.filingCert.capacity }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证类型</span>
                        <span class="info-value">{{ detail.filingCert.certType }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">备案证批复时间</span>
                        <span class="info-value">{{ detail.filingCert.approvalDate }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">发文机关</span>
                        <span class="info-value">{{ detail.filingCert.issuingAuthority }}</span>
                      </div>
                      <div class="info-item info-item--span2">
                        <span class="info-label">备案证批复内容</span>
                        <span class="info-value">{{ detail.filingCert.approvalContent }}</span>
                      </div>
                      <div class="info-item info-item--span2">
                        <span class="info-label">备案证附件</span>
                        <span class="info-value">
                          <FileAttachmentView v-if="detail.filingCert.attachmentName" :files="[detail.filingCert.attachmentName]" />
                          <span v-else>—</span>
                        </span>
                      </div>
                    </div>
                  </template>
                  <span v-else class="empty-hint">暂未关联备案证</span>
                </div>
              </div>
            </a-tab-pane>

            <!-- ──────── 合同付款比例 TAB（非标专属）──────── -->
            <a-tab-pane v-if="props.policyType === 'nonstandard'" key="payment" tab="合同付款比例">
              <div class="tab-body">
                <div v-for="(contract, idx) in detailPaymentContracts" :key="idx" class="payment-contract-card">
                  <div class="payment-contract-header">
                    <div class="payment-contract-type">{{ contract.type }}</div>
                    <div class="payment-contract-meta-row">
                      <span class="payment-meta-item"><span class="payment-meta-label">合同编号</span><span class="payment-meta-value">{{ contract.contractNo || '—' }}</span></span>
                      <span class="payment-meta-item"><span class="payment-meta-label">合同签订金额</span><span class="payment-meta-value">{{ contract.amount != null ? `¥${Number(contract.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` : '—' }}</span></span>
                      <span class="payment-meta-item"><span class="payment-meta-label">甲方</span><span class="payment-meta-value">{{ contract.partyA || '—' }}</span></span>
                      <span class="payment-meta-item"><span class="payment-meta-label">乙方</span><span class="payment-meta-value">{{ contract.partyB || '—' }}</span></span>
                      <span class="payment-meta-item"><span class="payment-meta-label">结算对象类型</span><span class="payment-meta-value">{{ contract.settlementType || '—' }}</span></span>
                    </div>
                  </div>
                  <table class="payment-ratio-table">
                    <thead>
                      <tr>
                        <th style="width:80px"></th>
                        <th v-for="row in contract.nodes" :key="row.node">{{ row.node }}</th>
                        <th style="width:120px">合计</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="payment-row-label">付款比例</td>
                        <td v-for="(row, nodeIdx) in contract.nodes" :key="row.node">
                          <a-input-number
                            v-if="paymentEditData[idx]"
                            v-model:value="paymentEditData[idx].ratios[nodeIdx]"
                            :min="0" :max="100" :precision="0" :controls="false"
                            style="width:80px"
                            addon-after="%"
                          />
                        </td>
                        <td :class="['payment-total-cell', paymentEditData[idx] && paymentTotal(idx) !== 100 ? 'payment-total-cell--error' : '']">
                          {{ paymentEditData[idx] ? paymentTotal(idx) : 0 }}%
                          <div v-if="paymentEditData[idx] && paymentTotal(idx) !== 100" class="payment-total-hint">需等于100%</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="payment-row-label">付款金额</td>
                        <td v-for="(row, nodeIdx) in contract.nodes" :key="row.node" class="payment-amount-cell">
                          {{ contract.amount != null && paymentEditData[idx]?.ratios[nodeIdx] != null
                            ? `¥${(contract.amount * (paymentEditData[idx].ratios[nodeIdx] ?? 0) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
                            : '—' }}
                        </td>
                        <td class="payment-amount-cell">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style="display:flex;justify-content:flex-end;padding-top:4px">
                  <a-button type="primary" :loading="paymentSubmitting" @click="handlePaymentSubmit">提交付款比例</a-button>
                </div>
              </div>
            </a-tab-pane>

          </a-tabs>
        </div>
      </div>

      <!-- 右侧：流转日志 -->
      <div class="detail-sidebar">
        <FlowLog :logs="currentLogs" />
      </div>
    </div>

    <!-- 审核 FAB -->
    <div v-if="showReviewFab" class="review-fab" @click="reviewCollapsed = false">
      <AuditOutlined style="font-size:16px;position:relative;top:-1px" />
      <span style="font-size:13px">{{ reviewPanelTitle }}</span>
    </div>

    <!-- 可拖拽审核面板 -->
    <div
      v-if="showReviewPanel"
      ref="reviewPanelEl"
      class="review-panel"
      :style="{ left: reviewPos.x + 'px', top: reviewPos.y + 'px', width: reviewSize.w + 'px', ...(reviewSize.h > 0 && { height: reviewSize.h + 'px' }) }"
      @mousedown="(e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('textarea,input,button,a,[role=button],.review-textarea-resize-handle,.review-drop-hint,.review-image-item,.review-corner-handle')) onReviewDragStart(e) }"
    >
      <!-- 四角缩放把手 -->
      <div class="review-corner-handle review-corner-handle--nw" @mousedown.stop="onCornerResizeStart($event, 'nw')" />
      <div class="review-corner-handle review-corner-handle--ne" @mousedown.stop="onCornerResizeStart($event, 'ne')" />
      <div class="review-corner-handle review-corner-handle--sw" @mousedown.stop="onCornerResizeStart($event, 'sw')" />
      <div class="review-corner-handle review-corner-handle--se" @mousedown.stop="onCornerResizeStart($event, 'se')" />

      <div class="review-panel-header" @mousedown.prevent="onReviewDragStart">
        <span class="review-panel-title">{{ reviewPanelTitle }}</span>
        <div style="display:flex;align-items:center;gap:16px">
          <HolderOutlined class="review-panel-drag-icon" />
          <span class="review-panel-close" @click.stop="reviewCollapsed = true">×</span>
        </div>
      </div>
      <div class="review-reject-reasons">
        <div class="review-reject-label">不通过原因</div>
        <a-select
          v-model:value="reviewRejectReasons"
          mode="multiple"
          :options="REJECT_REASONS.map(r => ({ label: r, value: r }))"
          placeholder="请选择不通过原因（可多选）"
          style="width:100%"
          :max-tag-count="2"
        />
      </div>
      <div
        class="review-textarea-wrap"
        :class="{ 'drag-over': reviewDragOver }"
        :style="reviewSize.h > 0 ? { flex: '1', minHeight: '0', overflow: 'hidden' } : {}"
      >
        <a-textarea
          v-model:value="reviewComment"
          placeholder="请输入审核意见..."
          :auto-size="false"
          :bordered="false"
          :style="{ flex: reviewSize.h > 0 ? '1' : 'none', resize: 'none', padding: '8px 12px', fontSize: '14px', height: reviewSize.h > 0 ? '100%' : '120px' }"
        />
      </div>
      <div
        class="review-drop-zone"
        :class="{ 'drag-over': reviewDragOver }"
        @dragover.prevent="reviewDragOver = true"
        @dragleave="reviewDragOver = false"
        @drop="onReviewDropZoneDrop"
      >
        <div v-if="reviewImageList.length === 0" class="review-drop-hint" @click="onReviewClickUpload">
          点击此处粘贴或拖拽图片上传
        </div>
        <div v-else class="review-image-list">
          <div v-for="img in reviewImageList" :key="img.uid" class="review-image-item">
            <img :src="img.url" :alt="img.name" />
            <span class="review-image-delete" @click.stop="removeReviewImage(img.uid)">×</span>
          </div>
        </div>
      </div>
      <div class="review-panel-footer">
        <a-button style="height:32px" @click="submitReview('skip')">暂不审核</a-button>
        <a-button style="height:32px" danger type="primary" @click="submitReview('reject')">审核不通过</a-button>
        <a-button style="height:32px" type="primary" @click="submitReview('pass')">审核通过</a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import FileAttachmentView from '../components/FileAttachmentView.vue'
import FlowLog from '../components/FlowLog.vue'
import {
  LeftOutlined, CopyOutlined,
  AuditOutlined, HolderOutlined, DownOutlined,
} from '@ant-design/icons-vue'
import { submitFilingSelfReview, submitFilingPlatformReview } from '../stores/stationStatus'

const props = defineProps<{ initStatus?: string; policyType?: string; initRow?: Record<string, any>; selfReviewRole?: string; platformReviewRole?: string }>()
const emit = defineEmits<{ back: []; edit: [id: string] }>()
const projectInfoOpen = ref(true)

function copyStationNo(no: string) {
  navigator.clipboard.writeText(no).then(() => message.success('已复制'))
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

const FILING_REJECTED_STATUSES: string[] = []
const STATUS_COLOR: Record<string, string> = {
  filing: 'warning', self_reviewing: 'processing', pending_review: 'purple', filing_approved: 'success',
  filing_self_rejected: 'error', filing_platform_rejected: 'error',
  waiting_start: 'default', approved: 'success',
}
const STATUS_LABEL: Record<string, string> = {
  filing: '建档中', self_reviewing: '建档自审中', pending_review: '建档平台审核中', filing_approved: '建档审核通过',
  filing_self_rejected: '建档自审不通过', filing_platform_rejected: '建档审核不通过',
  waiting_start: '待开工', approved: '审核通过',
}
const PROJECT_TYPE_LABEL: Record<string, string> = { emc: '常规 EMC', public_emc: '公建 EMC' }
const GRID_VOLTAGE_LABEL: Record<string, string> = { low: '低压', high: '中高压' }
const PUBLIC_BUILD_TYPE_LABEL: Record<string, string> = {
  education:    '科教文体公建',
  medical:      '医疗卫生公建',
  government:   '党政政务机构',
  enforcement:  '执法监管机构',
  public_welfare:'公益事业单位机构',
  other:        '其他',
}
const GRID_MODE_LABEL: Record<string, string> = {
  full: '全额上网', surplus: '余电上网',
  surplus_no_grid: '余电不上网', offgrid: '离网',
}
const STEEL_ROOF_LABEL: Record<string, string> = {
  standing_seam: '直立锁边型', angle_drive: '角驰型', trapezoidal: '梯型',
}
const RUST_LABEL: Record<string, string> = {
  none: '无锈蚀', light: '局部轻度锈蚀', severe: '严重锈蚀',
}
const INLET_CONN_LABEL: Record<string, string> = {
  dedicated: '专线接入', tee: 'T接接入',
}
const INTERVAL_LABEL: Record<string, string> = {
  yes: '有，需落实备用间隔是否可给光伏',
  space: '无，但有安装间隔的空间',
  no: '无',
}
const CABLE_PIPE_LABEL: Record<string, string> = {
  yes: '有', no_green: '无，有绿化带可直埋', no_road: '无，需破场内硬化道路',
}
const CABLE_TYPE_LABEL: Record<string, string> = {
  trench: '电缆沟', conduit: '电缆排管', other: '其它',
}
const PHOTO_CATEGORIES = [
  { key: 'exterior', label: '外观照片' },
  { key: 'roof',     label: '屋顶照片' },
  { key: 'meter',    label: '电表照片' },
  { key: 'inverter', label: '逆变器位置' },
  { key: 'other',    label: '其他' },
]
const STANDARD_PAYMENT_NODES = [
  { key: 'start',    label: '开工款',    pct: 30, desc: '开工验收后 15 个工作日内到账' },
  { key: 'grid',     label: '并网款',    pct: 30, desc: '并网验收后 15 个工作日内到账' },
  { key: 'complete', label: '竣工验收款', pct: 30, desc: '竣工验收后 15 个工作日内到账' },
  { key: 'warranty', label: '质保金',    pct: 10, desc: '质保期满后 30 个工作日内到账' },
]

// ─── mock 数据（接入时替换为接口返回） ───────────────────────────────────────

const detail = ref({
  id: 'LNC-2026-0001',
  filingStatus: (props.initRow?.filingStatus ?? props.initStatus ?? 'filing') as string,
  // 系统信息
  stationType: '工商业',
  stationNo:   props.initRow?.stationNo ?? 'LNC-2026-0001',
  // 基本信息
  oaNo: 'A304202607100012',
  projectName: props.initRow?.projectName ?? '杭州市滨江区某商业综合体光伏项目',
  projectType: 'emc',
  policyMatched: true,
  division: '安能智电事业部',
  regionCompany: '浙江区域公司',
  region: ['浙江省', '杭州市', '滨江区'],
  addressDetail: '××路×号商业综合体楼顶',
  capacity: 320,
  gridVoltage: 'low',
  // 代理商信息
  agentName: props.initRow?.agentName ?? '浙江绿能科技有限公司',
  // 用电企业信息
  userEntName:    '杭州某商业综合体管理有限公司',
  propertyProof:  ['产权证明.pdf'],
  bizLicense:     ['营业执照.pdf'],
  bankAccountCert:'开户许可证.pdf',
  idCardFront:    '身份证正面.jpg',
  idCardBack:     '身份证反面.jpg',
  // 供应商信息
  developerName:   '浙江华电开发有限公司',
  constructorName: '杭州建工集团有限公司',
  supervisorName:  '浙江工程监理有限公司',
  designerName:    '',
  // 合同信息
  emcPrice:        0.6500,
  emcYears:        20,
  consumptionRate: 85,
  // 公建信息（仅 public_emc）
  publicBuildType: null as string | null,
  // 项目产权信息
  projectCompany:   '杭州光伏资产管理有限公司',
  epcCompany:       '杭州安能智电 EPC 有限公司',
  ownershipCompany: '杭州光伏资产管理有限公司',
  // 商务
  commercial: {
    emcContract:    { contractNo: 'EMC-2026-0001', paymentCategory: '应收款项', partyA: '浙江某甲供应商有限公司', partyB: '杭州光伏资产管理有限公司', amount: 1200000, signDate: '2026-03-20', remark: '', files: ['EMC协议.pdf'] },
    smallEContract: { contractNo: 'XE-2026-0001', paymentCategory: '应付款项', partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '杭州建工集团有限公司', amount: 800000, signDate: '2026-03-22', remark: '', files: ['小E施工合同.pdf'], controllerName: '李四', controllerIdCard: '330102199001011234', controllerSpouseName: '王五', controllerSpouseIdCard: '330102199203021234' },
    designContract: { contractNo: 'DS-2026-0001', paymentCategory: '应付款项', partyA: '正泰安能数字能源（浙江）股份有限公司', partyB: '浙江华电开发有限公司', amount: 50000, signDate: '2026-03-25', remark: '', files: [] },
    jianliContract: { contractNo: 'JL-2026-0001', paymentCategory: '应付款项', partyA: '杭州光伏资产管理有限公司', partyB: '浙江工程监理有限公司', amount: 30000, signDate: '2026-03-28', remark: '', files: [] },
    otherContracts: [],
  },
  // 勘察
  gridMode: 'surplus',
  buildingCount: 3,
  roofLightSteel: 2,
  roofConcrete: 1,
  roofOther: 0,
  siteLayoutFiles: ['总平面布置图.pdf'],
  steelRoofType: 'standing_seam',
  rustCondition: 'light',
  hasObstacle: 'no',
  obstacleHeight: null as number | null,
  obstacleWidth: null as number | null,
  hasSkylight: 'yes',
  skylightWidth: 200,
  inletVoltage: 10,
  inletConnectionType: 'dedicated',
  circuitCount: 2,
  cableSpec: 150,
  transformerCount: 3,
  transformerKVA: 1200,
  hasInterval: 'yes',
  hasIndoorSpace: 'yes',
  indoorLength: 6.5,
  indoorWidth: 4.0,
  hasCablePipe: 'yes',
  cablePipeType: 'trench',
  drawingFiles: ['项目图纸.dwg'],
  electricityFiles: ['用电情况报告.pdf'],
  approvalFiles: ['接入批复文件.pdf'],
  scenes: [
    { type: '屋顶', blocks: 560, tiltAngle: 10, specialPlan: null },
    { type: '车棚', blocks: 220, tiltAngle: 5,  specialPlan: null },
  ],
  photos: {
    exterior: Array.from({ length: 10 }, (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    roof:     Array.from({ length: 4 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    meter:    Array.from({ length: 2 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    inverter: Array.from({ length: 3 },  (_, i) => 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIj48cmVjdCB3aWR0aD0iMTYwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2QwZGNlOCIgcng9IjQiLz48dGV4dCB4PSI4MCIgeT0iODYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9InJnYmEoMCwwLDAsMC4zNSkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj7njrDlnLrnhafniYc8L3RleHQ+PC9zdmc+'),
    other:    [],
  },
  jiagongBom: [
    { code: 'M001', name: '单晶硅光伏组件 545W', group: '组件',   unit: '块', quantity: 560 },
    { code: 'M002', name: '组串式逆变器 50kW',   group: '逆变器', unit: '台', quantity: 8 },
  ],
  yigongBom: [
    { code: 'TB0002', name: '400kVA柱上变压器', type: '中高压', unit: '台', quantity: 2 },
    { code: 'TJ0080', name: '台架变',           type: '低压',   unit: '台', quantity: 1 },
  ],
  designQualFiles: ['设计资质证书.pdf'],
  electricalDesignFiles: ['电气设计图.dwg'],
  structuralDesignFiles: ['结构设计图.dwg'],
  safetyAssessFiles: [],
  otherAttachFiles: [],
  filingCert: {
    fileName: '杭州滨江综合体光伏备案证',
    filingType: '备案',
    projectName: '杭州市滨江区某商业综合体光伏项目',
    projectCode: 'PJ-2026-0001',
    ownershipCompany: '杭州光伏资产管理有限公司',
    certNo: 'BC-2026-0001',
    capacity: 320000,
    certType: '分布式光伏',
    approvalDate: '2026-03-15',
    issuingAuthority: '杭州市滨江区发展和改革局',
    approvalContent: '同意该项目在滨江区××路×号商业综合体楼顶建设分布式光伏发电项目，装机容量320kW，接入10kV电网。',
    attachmentName: '杭州滨江综合体光伏备案批复文件.pdf',
  },
  rejectInfo: {
    stage: '商务审核',
    reviewer: '李四（安能审核员）',
    time: '2026-08-11 15:30',
    reason: 'EMC 电价填写有误，当前区域标准电价为 0.6200 元/kWh，请核实后重新提交。',
  },
  logs: [] as { id: number; type: string; event: string; operator: string; time: string; note: string | null }[],
})

watch(() => props.initRow?.filingStatus ?? props.initStatus, (val) => {
  if (val) detail.value.filingStatus = val
}, { immediate: true })

// filingStatus 直接从 props 派生，保证与 v-if 条件始终同步
const filingStatusFromProps = computed(() =>
  (props.initRow?.filingStatus ?? props.initStatus ?? 'filing') as string
)

// ─── 状态对应的流转日志 ───────────────────────────────────────────────────────

type LogEntry = { id: number; type: string; event: string; operator: string; time: string; note: string | null }

const currentLogs = computed(() => {
  const status = detail.value.filingStatus
  const selfP   = (props.initRow?.selfReviewProgress   ?? {}) as Record<string, string | null>
  const platP   = (props.initRow?.platformReviewProgress ?? {}) as Record<string, string | null>

  // 固定底部：创建/草稿
  const base: LogEntry[] = [
    { id: 0, type: 'create', event: '保存草稿', operator: '张三（代理商）', time: '2026-08-10 14:05', note: null },
    { id: 0, type: 'create', event: '创建建档', operator: '张三（代理商）', time: '2026-08-10 09:32', note: null },
  ]

  // 自审阶段条目
  const selfEntries: LogEntry[] = []
  if (selfP.tech) selfEntries.push({
    id: 0,
    type: selfP.tech === 'pass' ? 'approve' : 'reject',
    event: selfP.tech === 'pass' ? '技术自审通过' : '技术自审不通过',
    operator: '王五（技术审核员）',
    time: '2026-08-11 16:10',
    note: selfP.tech === 'reject' ? '屋面承重核算数据缺失，请补充结构安全评估报告。' : null,
  })
  if (selfP.biz) selfEntries.push({
    id: 0,
    type: selfP.biz === 'pass' ? 'approve' : 'reject',
    event: selfP.biz === 'pass' ? '商务自审通过' : '商务自审不通过',
    operator: '赵六（商务审核员）',
    time: '2026-08-11 14:30',
    note: selfP.biz === 'reject' ? 'EMC 电价填写有误，当前区域标准电价为 0.6200 元/kWh，请核实后重新提交。' : null,
  })

  const submitEntry: LogEntry = { id: 0, type: 'submit', event: '提交建档（自审中）', operator: '张三（代理商）', time: '2026-08-10 17:20', note: null }
  const platformSubmitEntry: LogEntry = { id: 0, type: 'submit', event: '提交平台审核', operator: '系统（自审通过）', time: '2026-08-11 09:00', note: null }

  // 平台审核阶段条目
  const platEntries: LogEntry[] = []
  if (platP.tech) platEntries.push({
    id: 0,
    type: platP.tech === 'pass' ? 'approve' : 'reject',
    event: platP.tech === 'pass' ? '平台技术审核通过' : '平台技术审核不通过',
    operator: '李四（平台技术审核员）',
    time: '2026-08-12 11:20',
    note: platP.tech === 'reject' ? '现场勘测照片不符合要求，屋顶结构照片模糊，请重新拍摄上传。' : null,
  })
  if (platP.biz) platEntries.push({
    id: 0,
    type: platP.biz === 'pass' ? 'approve' : 'reject',
    event: platP.biz === 'pass' ? '平台商务审核通过' : '平台商务审核不通过',
    operator: '孙七（平台商务审核员）',
    time: '2026-08-12 10:00',
    note: platP.biz === 'reject' ? '合同签约主体与项目公司不一致，请核实后重新提交。' : null,
  })

  let entries: LogEntry[] = []
  if (status === 'filing') {
    entries = [...base]
  } else if (['self_reviewing', 'filing_self_rejected'].includes(status)) {
    entries = [...selfEntries, submitEntry, ...base]
  } else {
    entries = [...platEntries, platformSubmitEntry, ...selfEntries, submitEntry, ...base]
  }

  return entries.map((e, i) => ({ ...e, id: entries.length - i }))
})

// ─── 权限 ────────────────────────────────────────────────────────────────────

const canEdit = computed(() => detail.value.filingStatus === 'filing')
const canVoid = computed(() => detail.value.filingStatus === 'filing')

// ─── 表格列 ───────────────────────────────────────────────────────────────────

const activeTab = ref('survey')

const detailBodyRef = ref<HTMLElement | null>(null)
const tabsWrapperRef = ref<HTMLElement | null>(null)
const tabsStuck = ref(false)

async function scrollToTabNav() {
  await nextTick()
  const body    = detailBodyRef.value
  const wrapper = tabsWrapperRef.value
  if (!body || !wrapper) return
  tabsStuck.value = true
  await nextTick()
  const target = Math.round(
    wrapper.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop
  )
  body.scrollTop = target
}

let _scrollHandler: (() => void) | null = null

onMounted(() => {
  _scrollHandler = () => {
    const body    = detailBodyRef.value
    const wrapper = tabsWrapperRef.value
    if (!body || !wrapper) return
    tabsStuck.value = wrapper.getBoundingClientRect().top <= body.getBoundingClientRect().top + 1
  }
  detailBodyRef.value?.addEventListener('scroll', _scrollHandler, { passive: true })
})

onUnmounted(() => {
  if (_scrollHandler) detailBodyRef.value?.removeEventListener('scroll', _scrollHandler)
})

// ── 合同付款比例（非标详情可编辑）────────────────────────────
const DETAIL_PAYMENT_NODES = ['开工', '并网', '竣工验收', '质保金']
const detailPaymentContracts = computed(() => {
  const c = detail.value.commercial
  const base = [
    { type: '小E施工承包合同（常规EMC）', contractNo: c.smallEContract.contractNo, amount: c.smallEContract.amount, partyA: c.smallEContract.partyA, partyB: c.smallEContract.partyB, settlementType: '施工方',
      nodes: [{ node: '开工', ratio: 30 }, { node: '并网', ratio: 30 }, { node: '竣工验收', ratio: 30 }, { node: '质保金', ratio: 10 }] },
    { type: '设计合同', contractNo: c.designContract.contractNo, amount: c.designContract.amount, partyA: c.designContract.partyA, partyB: c.designContract.partyB, settlementType: '设计院',
      nodes: [{ node: '开工', ratio: 50 }, { node: '并网', ratio: 30 }, { node: '竣工验收', ratio: 20 }, { node: '质保金', ratio: 0 }] },
    ...(c.otherContracts ?? []).map((oc: any, i: number) => ({
      type: `其他合同${i + 1}`, contractNo: oc.contractNo, amount: oc.amount, partyA: oc.partyA, partyB: oc.partyB, settlementType: null as string | null,
      nodes: DETAIL_PAYMENT_NODES.map(n => ({ node: n, ratio: null as number | null }))
    }))
  ]
  return base
})

const paymentEditData = ref<{ ratios: (number | null)[] }[]>([])
const paymentSubmitting = ref(false)

watch(detailPaymentContracts, (contracts) => {
  paymentEditData.value = contracts.map(c => ({
    ratios: c.nodes.map((n: any) => n.ratio)
  }))
}, { immediate: true })

function paymentTotal(idx: number) {
  return (paymentEditData.value[idx]?.ratios ?? []).reduce((s, r) => s + (r ?? 0), 0)
}

async function handlePaymentSubmit() {
  const allValid = detailPaymentContracts.value.every((_, idx) => paymentTotal(idx) === 100)
  if (!allValid) {
    message.error('各合同付款比例之和须等于 100%')
    return
  }
  paymentSubmitting.value = true
  await new Promise(r => setTimeout(r, 800))
  paymentSubmitting.value = false
  message.success('付款比例已提交')
}

const sceneColumns = [
  { title: '序号',       key: 'index',       width: 60,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '应用场景',   dataIndex: 'type',  key: 'type',  width: 140 },
  { title: '应用场景块数', dataIndex: 'blocks', key: 'blocks', width: 120 },
  { title: '倾角',       dataIndex: 'tiltAngle', key: 'tiltAngle', width: 100, customRender: ({ text }: { text: number | null }) => text != null ? text + '°' : '—' },
  { title: '特殊方案',   dataIndex: 'specialPlan', key: 'specialPlan', width: 160, customRender: ({ text }: { text: string | null }) => text || '—' },
]
const jiagongReadonlyColumns = [
  { title: '序号',     key: 'index',    width: 52,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '物料编码', dataIndex: 'code',     key: 'code',  width: 120 },
  { title: '物料名称', dataIndex: 'name',     key: 'name',  width: 220, ellipsis: true },
  { title: '物料组',   dataIndex: 'group',    key: 'group', width: 90 },
  { title: '单位',     dataIndex: 'unit',     key: 'unit',  width: 64 },
  { title: 'BOM类型',  key: 'bomType', width: 90, customRender: () => '电器BOM' },
  { title: '确认数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
]
const yigongReadonlyColumns = [
  { title: '序号',     key: 'index',    width: 52,  customRender: ({ index }: { index: number }) => index + 1 },
  { title: '类型',     dataIndex: 'type',  key: 'type',  width: 80 },
  { title: '物料编号', dataIndex: 'code',  key: 'code',  width: 120 },
  { title: '物料描述', dataIndex: 'name',  key: 'name',  width: 220, ellipsis: true },
  { title: '单位',     dataIndex: 'unit',  key: 'unit',  width: 64 },
  { title: '确认数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
]

// ─── 操作 ─────────────────────────────────────────────────────────────────────

const handleEdit = () => {
  emit('edit', detail.value.id)
}

const handleVoid = async () => {
  try {
    await voidFiling(detail.value.id)
    message.success('已作废')
    emit('back')
  } catch {
    message.error('作废失败，请重试')
  }
}

async function voidFiling(_id: string) {}

// ─── 审核面板 ─────────────────────────────────────────────────────────────────

const reviewPanelVisible = ref(true)
const reviewCollapsed    = ref(!props.selfReviewRole && !props.platformReviewRole)

const activeReviewRole = computed(() => props.selfReviewRole || props.platformReviewRole || null)
const reviewPhase      = computed<'self' | 'platform' | null>(() =>
  props.selfReviewRole ? 'self' : props.platformReviewRole ? 'platform' : null
)
const ROLE_LABEL: Record<string, string> = { biz: '商务', tech: '技术' }
const reviewPanelTitle = computed(() => {
  const r = ROLE_LABEL[activeReviewRole.value ?? ''] ?? ''
  return reviewPhase.value === 'self' ? `建档${r}自审` : reviewPhase.value === 'platform' ? `建档${r}审核` : '建档审核'
})

const showReviewFab   = computed(() => !!activeReviewRole.value && reviewPanelVisible.value &&  reviewCollapsed.value)
const showReviewPanel = computed(() => !!activeReviewRole.value && reviewPanelVisible.value && !reviewCollapsed.value)

async function positionReviewPanel() {
  await nextTick()
  if (reviewPanelEl.value) {
    const h = reviewPanelEl.value.getBoundingClientRect().height
    reviewPos.x = window.innerWidth - reviewSize.w - 32
    reviewPos.y = window.innerHeight - h - 32
  }
}

watch(reviewCollapsed, (collapsed) => { if (!collapsed) positionReviewPanel() })

// 自审/平台审核自动展开时初始定位
if (!reviewCollapsed.value) nextTick(positionReviewPanel)

const REJECT_REASONS = [
  '商务信息填写有误',
  '附件资料不完整或不清晰',
  '备案证信息与项目不符',
  '项目容量填写有误',
  '合同信息缺失或有误',
  '代理商资质不满足要求',
  '勘察数据与现场不符',
  '其他原因',
]
const reviewRejectReasons = ref<string[]>([])
const reviewComment       = ref('')
const reviewImageList     = ref<{ uid: string; name: string; url: string }[]>([])
const reviewDragOver      = ref(false)
const reviewPanelEl  = ref<HTMLElement | null>(null)
const reviewSize     = reactive({ w: 420, h: 0 })
const reviewPos      = reactive({ x: 0, y: 0 })
const reviewDragging = reactive({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 })
const cornerResizing = reactive({ active: false, corner: '' as 'nw'|'ne'|'sw'|'se'|'', startX: 0, startY: 0, startW: 0, startH: 0, startPX: 0, startPY: 0 })


function onReviewDragStart(e: MouseEvent) {
  reviewDragging.active = true
  reviewDragging.startX = e.clientX; reviewDragging.startY = e.clientY
  reviewDragging.originX = reviewPos.x; reviewDragging.originY = reviewPos.y
  window.addEventListener('mousemove', onReviewDragMove)
  window.addEventListener('mouseup', onReviewDragEnd)
}
function onReviewDragMove(e: MouseEvent) {
  if (!reviewDragging.active) return
  reviewPos.x = reviewDragging.originX + (e.clientX - reviewDragging.startX)
  reviewPos.y = reviewDragging.originY + (e.clientY - reviewDragging.startY)
}
function onReviewDragEnd() {
  reviewDragging.active = false
  window.removeEventListener('mousemove', onReviewDragMove)
  window.removeEventListener('mouseup', onReviewDragEnd)
}
function onCornerResizeStart(e: MouseEvent, corner: 'nw'|'ne'|'sw'|'se') {
  e.preventDefault(); e.stopPropagation()
  const currentH = reviewPanelEl.value?.getBoundingClientRect().height ?? 480
  if (reviewSize.h === 0) reviewSize.h = currentH
  cornerResizing.active = true; cornerResizing.corner = corner
  cornerResizing.startX = e.clientX; cornerResizing.startY = e.clientY
  cornerResizing.startW = reviewSize.w; cornerResizing.startH = reviewSize.h
  cornerResizing.startPX = reviewPos.x; cornerResizing.startPY = reviewPos.y
  window.addEventListener('mousemove', onCornerResizeMove)
  window.addEventListener('mouseup', onCornerResizeEnd)
}
function onCornerResizeMove(e: MouseEvent) {
  if (!cornerResizing.active) return
  const dx = e.clientX - cornerResizing.startX
  const dy = e.clientY - cornerResizing.startY
  const minW = 332, minH = 380
  const c = cornerResizing.corner
  const newW = Math.max(minW, cornerResizing.startW + (c === 'ne' || c === 'se' ? dx : -dx))
  const newH = Math.max(minH, cornerResizing.startH + (c === 'sw' || c === 'se' ? dy : -dy))
  reviewSize.w = newW
  reviewSize.h = newH
  if (c === 'nw' || c === 'sw') reviewPos.x = cornerResizing.startPX + (cornerResizing.startW - newW)
  if (c === 'nw' || c === 'ne') reviewPos.y = cornerResizing.startPY + (cornerResizing.startH - newH)
}
function onCornerResizeEnd() {
  cornerResizing.active = false
  window.removeEventListener('mousemove', onCornerResizeMove)
  window.removeEventListener('mouseup', onCornerResizeEnd)
}
function onReviewDropZoneDrop(e: DragEvent) {
  e.preventDefault(); reviewDragOver.value = false
  if (e.dataTransfer?.files) addReviewFiles(Array.from(e.dataTransfer.files))
}
function addReviewFiles(files: File[]) {
  files.filter(f => f.type.startsWith('image/')).forEach(f => {
    reviewImageList.value.push({ uid: Date.now() + '-' + f.name, name: f.name, url: URL.createObjectURL(f) })
  })
}
function removeReviewImage(uid: string) {
  reviewImageList.value = reviewImageList.value.filter(img => img.uid !== uid)
}
function onReviewClickUpload() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = 'image/*'; input.multiple = true
  input.onchange = () => { if (input.files) addReviewFiles(Array.from(input.files)) }
  input.click()
}
function submitReview(action: 'pass' | 'reject' | 'skip') {
  if (action === 'skip') { message.info('暂不审核'); return }
  const role  = activeReviewRole.value
  const phase = reviewPhase.value
  const label = reviewPanelTitle.value
  if (role && phase === 'self') {
    submitFilingSelfReview(props.initRow?.id ?? detail.value.id, role, action)
  } else if (role && phase === 'platform') {
    submitFilingPlatformReview(props.initRow?.id ?? detail.value.id, role, action)
  }
  if (action === 'pass')   message.success(`${label}通过`)
  else                     message.error(`${label}不通过`)
  reviewPanelVisible.value = false
  emit('back')
}
</script>

<style scoped>
/* ── 整体布局 ── */
.detail-page {
  height: calc(100vh - 81px);
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* ── 固定顶栏 ── */
.detail-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 160px;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.detail-header-left { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.detail-header-left :deep(.ant-tag) { flex-shrink: 0; margin-inline-end: 0; }
.node-dot-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: rgba(0,0,0,0.65); background: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; padding: 0 7px; line-height: 20px; flex-shrink: 0; }
.node-dot-tag__dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.back-btn { color: #595959; flex-shrink: 0; }
.detail-title { font-size: 16px; font-weight: 600; margin-left: 4px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 1; }
.detail-header-meta { display: flex; align-items: center; margin-left: 12px; gap: 0; flex-shrink: 0; }
.detail-header-meta-item { font-size: 13px; color: rgba(0,0,0,0.45); }
.detail-header-meta-divider { display: inline-block; width: 1px; height: 12px; background: rgba(0,0,0,0.15); margin: 0 8px; }

/* ── 内容区 ── */
.detail-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  overscroll-behavior: contain;
}
.detail-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.detail-sidebar { width: 300px; flex-shrink: 0; align-self: flex-start; position: sticky; top: 0; height: calc(100vh - 170px); }

/* ── 退回原因卡片 ── */
/* ── 主内容卡片 ── */
.detail-card { border-radius: 8px; }
.tabs-wrapper { background: #fff; border-radius: 8px; }
.detail-card--plain { background: #fff; padding: 20px; }
.detail-tabs :deep(.ant-tabs-nav) { position: sticky !important; top: -16px !important; z-index: 9; background: #fff; border-radius: 8px 8px 0 0; }
.tabs-stuck .detail-tabs :deep(.ant-tabs-nav) { border-radius: 0; }
.detail-tabs :deep(.ant-tabs-content-holder) { padding: 0; }
.tab-body { padding: 20px; }

/* ── 信息分区 ── */
.info-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f5f5f5;
}
.info-section:first-child,
.section-title + .info-section { margin-top: 0; padding-top: 0; border-top: none; }
.tab-body--design .info-section { border-top: none; padding-top: 0; margin-top: 32px; }
.tab-body--commercial .info-section { border-top: none; padding-top: 0; margin-top: 32px; }

.section-title--toggle { cursor: pointer; display: flex; align-items: center; justify-content: space-between; user-select: none; }
.section-title--collapsed { margin-bottom: 0 !important; }
.section-toggle-icon { font-size: 12px; color: #8c8c8c; background: #f0f0f0; padding: 7px 6px 5px; border-radius: 4px; display: inline-flex; align-items: center; transition: transform 0.2s; }
.section-toggle-icon.rotated { transform: rotate(180deg); }
.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #000;
  margin-bottom: 24px;
}
.info-section-title {
  font-size: 16px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  margin: 20px 0 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 16px;
  background: #1677ff;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── 信息栅格（Figma 规范：4列，gap 20px，label上/value下） ── */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.info-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.info-item--span2 { grid-column: span 2; }
.info-item--span4 { grid-column: span 4; }
.info-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 22px;
  padding-bottom: 8px;
  white-space: nowrap;
}
.info-value {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  line-height: 22px;
  word-break: break-word;
}

.contract-block-ro {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 16px;
  overflow: hidden;
}
.contract-block-ro-header {
  background: #fafafa;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(0,0,0,0.85);
  border-bottom: 1px solid #f0f0f0;
}
.contract-block-ro .info-grid { padding: 16px; }
.section-sub { font-size: 12px; color: #8c8c8c; }

/* ── 勘察照片只读 ── */
.photo-readonly-col   { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.photo-readonly-label { font-size: 14px; color: rgba(0,0,0,0.45); }
.photo-readonly-imgs  { display: flex; flex-wrap: wrap; gap: 8px; }
.empty-hint { font-size: 13px; color: #bbb; padding-top: 4px; }


/* ── 身份证预览 ── */
.id-card-img { width: 150px; height: 100px; border-radius: 7px; }
.id-card-img--front { background: #DDE8F4; }
.id-card-img--back  { background: #D6E3EF; }

/* ── 付款节点 ── */
.payment-nodes { display: flex; gap: 10px; margin-bottom: 20px; }
.payment-node-row {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 16px; background: #fafafa;
  border: 1px solid #f0f0f0; border-radius: 6px;
  flex: 1; text-align: center;
}
.payment-node-label { font-size: 13px; font-weight: 500; }
.payment-node-pct { font-size: 15px; font-weight: 600; color: #1677ff; }
.payment-node-desc { font-size: 12px; color: #8c8c8c; line-height: 1.4; }

/* ── 审核面板 ── */
.review-fab {
  position: fixed; right: 24px; bottom: 24px; z-index: 1001;
  height: 40px; padding: 0 16px; border-radius: 20px;
  background: #007BFE; color: #fff;
  display: flex; flex-direction: row; align-items: center; gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,123,254,0.35);
  transition: box-shadow .15s, transform .15s;
}
.review-fab:hover { box-shadow: 0 6px 20px rgba(0,123,254,0.45); transform: translateY(-1px); }
.review-panel {
  position: fixed; z-index: 1000; width: 420px;
  background: #fff; border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
  display: flex; flex-direction: column; overflow: hidden; user-select: none;
}
.review-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 20px 0; cursor: grab; background: #fff;
}
.review-panel-header:active { cursor: grabbing; }
.review-panel-title { font-size: 15px; font-weight: 600; color: rgba(0,0,0,0.88); }
.review-panel-drag-icon { font-size: 16px; color: #9ca3af; cursor: grab; transform: rotate(90deg) translateX(2px); }
.review-panel-drag-icon:hover { color: #6b7280; }
.review-panel-close { font-size: 20px; color: #9ca3af; cursor: pointer; line-height: 1; padding: 0 2px; }
.review-panel-close:hover { color: #374151; }
.review-textarea-wrap {
  display: flex; flex-direction: column;
  margin: 0 20px 0; border: 1px solid #d9d9d9; border-bottom: none;
  border-radius: 8px 8px 0 0; overflow: hidden; transition: border-color .15s;
}
.review-drop-zone {
  margin: 0 20px; border: 1px solid #d9d9d9; border-top: none;
  border-radius: 0 0 8px 8px; overflow: hidden; transition: border-color .15s, box-shadow .15s;
}
.review-drop-zone::before {
  content: ''; display: block; height: 1px; background: #f0f0f0; margin: 0 12px;
}
.review-textarea-wrap.drag-over,
.review-drop-zone.drag-over {
  border-color: #3060FF; box-shadow: 0 0 0 2px rgba(48,96,255,0.12);
}
.review-drop-hint { padding: 20px; font-size: 14px; color: #a7a5b0; cursor: pointer; }
.review-image-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 20px; }
.review-image-item { position: relative; display: inline-block; }
.review-image-item img { width: 72px; height: 72px; object-fit: cover; border-radius: 4px; border: 1px solid #f0f0f0; display: block; }
.review-image-delete { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff; font-size: 13px; line-height: 18px; text-align: center; cursor: pointer; display: none; }
.review-image-item:hover .review-image-delete { display: block; }
.review-panel-footer { display: flex; gap: 8px; justify-content: flex-end; padding: 20px; }
.review-reject-reasons { padding: 20px 20px 12px; }
.review-reject-label { font-size: 14px; color: rgba(0,0,0,0.65); margin-bottom: 6px; }
.review-corner-handle {
  position: absolute; width: 16px; height: 16px; z-index: 20;
}
.review-corner-handle--nw { top: 0; left: 0; cursor: nwse-resize; }
.review-corner-handle--ne { top: 0; right: 0; cursor: nesw-resize; }
.review-corner-handle--sw { bottom: 0; left: 0; cursor: nesw-resize; }
.review-corner-handle--se { bottom: 0; right: 0; cursor: nwse-resize; }

/* ── 合同付款比例（非标详情）── */
.payment-contract-card { border: 1px solid #e8e8e8; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
.payment-contract-header { padding: 12px 16px; background: #fafafa; border-bottom: 1px solid #e8e8e8; }
.payment-contract-type { font-size: 14px; font-weight: 600; color: #262626; margin-bottom: 10px; }
.payment-contract-meta-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 24px; }
.payment-meta-item { display: flex; align-items: center; gap: 4px; font-size: 13px; }
.payment-meta-label { color: #8c8c8c; }
.payment-meta-value { color: #262626; }
.payment-ratio-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.payment-ratio-table th { padding: 10px 12px; text-align: left; background: #f5f5f5; color: #595959; font-weight: 500; border-bottom: 1px solid #e8e8e8; }
.payment-ratio-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; position: relative; top: -0.5px; }
.payment-ratio-table tbody tr:last-child td { border-bottom: none; }
.payment-row-label { color: #8c8c8c; font-size: 13px; white-space: nowrap; }
.payment-amount-cell { color: #262626; font-variant-numeric: tabular-nums; }
.payment-total-cell { font-weight: 600; color: #262626; }
.payment-total-cell--error { color: #dc2626; }
.payment-total-hint { font-size: 11px; font-weight: 400; color: #dc2626; margin-top: 2px; }
.copy-icon {
  margin-left: 5px;
  font-size: 12px;
  color: rgba(0,0,0,0.35);
  cursor: pointer;
  vertical-align: middle; position: relative; top: -0.5px;
}
.copy-icon:hover { color: #1677ff; }
</style>
